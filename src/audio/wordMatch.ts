import { audioContext } from './engine'

/**
 * Reconnaissance des noms de notes « par le son » (essai, écran Test du micro) : sans Internet ni service de
 * reconnaissance, chaque syllabe dite est comparée aux enregistrements du joueur (« do », « ré »…).
 * - le son du micro est découpé en syllabes d'après son énergie (une syllabe commence quand la voix monte, finit
 *   après un court silence ou un creux de voix) ;
 * - chaque syllabe est résumée en coefficients cepstraux (MFCC), la forme du spectre au fil du temps ;
 * - la syllabe est attribuée à l'enregistrement le plus proche (déformation temporelle dynamique, DTW).
 */

const RATE = 16000
const FRAME = 400 // 25 ms
const HOP = 160 // 10 ms
const FFT = 512
const MELS = 26
const COEFFS = 12

/** Une syllabe : ses coefficients, trame par trame (une toutes les 10 ms). */
export type Features = number[][]

/** Rééchantillonne à 16 kHz (moyenne de chaque groupe d'échantillons, qui coupe aussi les aigus inutiles). */
export function downsample(input: Float32Array, rate: number): Float32Array {
  const ratio = rate / RATE
  if (ratio <= 1) return input
  const out = new Float32Array(Math.floor(input.length / ratio))
  for (let i = 0; i < out.length; i++) {
    const from = Math.floor(i * ratio)
    const to = Math.min(input.length, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = from; j < to; j++) sum += input[j]
    out[i] = sum / Math.max(1, to - from)
  }
  return out
}

/** Transformée de Fourier (sur place, taille puissance de 2). */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(angle * k)
        const wi = Math.sin(angle * k)
        const a = i + k
        const b = a + len / 2
        const xr = re[b] * wr - im[b] * wi
        const xi = re[b] * wi + im[b] * wr
        re[b] = re[a] - xr
        im[b] = im[a] - xi
        re[a] += xr
        im[a] += xi
      }
    }
  }
}

const mel = (hz: number) => 2595 * Math.log10(1 + hz / 700)
const hzOf = (m: number) => 700 * (10 ** (m / 2595) - 1)

/** Bancs de filtres triangulaires sur l'échelle des mels (80 à 7 600 Hz). */
const FILTERS: number[][] = (() => {
  const low = mel(80)
  const high = mel(7600)
  const points = Array.from({ length: MELS + 2 }, (_, i) => Math.floor(((FFT + 1) * hzOf(low + ((high - low) * i) / (MELS + 1))) / RATE))
  return Array.from({ length: MELS }, (_, m) => {
    const f = new Array(FFT / 2 + 1).fill(0)
    for (let k = points[m]; k < points[m + 1]; k++) f[k] = (k - points[m]) / Math.max(1, points[m + 1] - points[m])
    for (let k = points[m + 1]; k < points[m + 2]; k++) f[k] = (points[m + 2] - k) / Math.max(1, points[m + 2] - points[m + 1])
    return f
  })
})()

const WINDOW = Array.from({ length: FRAME }, (_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (FRAME - 1)))

/** Coefficients cepstraux d'un son à 16 kHz, centrés (la couleur du micro et de la pièce s'efface). */
export function features(samples: Float32Array): Features {
  const frames: number[][] = []
  const re = new Float64Array(FFT)
  const im = new Float64Array(FFT)
  for (let start = 0; start + FRAME <= samples.length; start += HOP) {
    re.fill(0)
    im.fill(0)
    for (let i = 0; i < FRAME; i++) re[i] = (samples[start + i] - (i ? 0.97 * samples[start + i - 1] : 0)) * WINDOW[i]
    fft(re, im)
    const power = Array.from({ length: FFT / 2 + 1 }, (_, k) => re[k] * re[k] + im[k] * im[k])
    const energies = FILTERS.map((f) => Math.log(1e-10 + f.reduce((s, w, k) => s + w * power[k], 0)))
    const coeffs: number[] = []
    for (let c = 1; c <= COEFFS; c++) {
      let sum = 0
      for (let m = 0; m < MELS; m++) sum += energies[m] * Math.cos((Math.PI * c * (m + 0.5)) / MELS)
      coeffs.push(sum)
    }
    frames.push(coeffs)
  }
  if (!frames.length) return frames
  const mean = frames[0].map((_, c) => frames.reduce((s, f) => s + f[c], 0) / frames.length)
  return frames.map((f) => f.map((v, c) => v - mean[c]))
}

/** Distance entre deux syllabes, quelle que soit la vitesse à laquelle elles ont été dites (DTW, par trame). */
export function distance(a: Features, b: Features): number {
  if (!a.length || !b.length) return Infinity
  const d = (i: number, j: number) => Math.sqrt(a[i].reduce((s, v, c) => s + (v - b[j][c]) ** 2, 0))
  let prev = new Float64Array(b.length + 1).fill(Infinity)
  prev[0] = 0
  for (let i = 1; i <= a.length; i++) {
    const cur = new Float64Array(b.length + 1).fill(Infinity)
    for (let j = 1; j <= b.length; j++) cur[j] = d(i - 1, j - 1) + Math.min(prev[j], cur[j - 1], prev[j - 1])
    prev = cur
  }
  return prev[b.length] / (a.length + b.length)
}

/** Enregistrements du joueur : plusieurs par syllabe. */
export type Templates = Record<string, Features[]>

/** La syllabe la plus proche parmi les enregistrements, avec sa distance et l'écart avec la suivante. */
export function closest(f: Features, templates: Templates): { key: string; distance: number; margin: number } | null {
  const best = Object.entries(templates)
    .map(([key, list]) => ({ key, distance: Math.min(...list.map((t) => distance(f, t))) }))
    .filter((r) => Number.isFinite(r.distance))
    .sort((x, y) => x.distance - y.distance)
  if (!best.length) return null
  return { key: best[0].key, distance: best[0].distance, margin: (best[1]?.distance ?? Infinity) - best[0].distance }
}

/** Une syllabe découpée dans le son du micro, avec l'instant de son début et de sa fin (performance.now()). */
export interface Syllable {
  features: Features
  start: number
  end: number
}

export interface SyllableListening {
  stop: () => void
}

/**
 * Écoute le micro et découpe la voix en syllabes : une syllabe commence quand l'énergie monte nettement au-dessus du
 * bruit de fond, et finit après 80 ms de silence, à un creux de voix (notes enchaînées) ou au bout de 700 ms.
 * `onLevel` reçoit le niveau (0 à 1) pour l'affichage.
 */
export async function listenToSyllables(onSyllable: (s: Syllable) => void, onLevel?: (level: number) => void): Promise<SyllableListening> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro indisponible')
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } })
  const ctx = audioContext()
  const source = ctx.createMediaStreamSource(stream)
  const processor = ctx.createScriptProcessor(1024, 1, 1)
  const mute = ctx.createGain()
  mute.gain.value = 0
  source.connect(processor)
  processor.connect(mute)
  mute.connect(ctx.destination)

  const hop = Math.round((ctx.sampleRate * HOP) / RATE)
  let pending = new Float32Array(0)
  /** Son récent (pour garder un peu avant l'attaque) et son de la syllabe en cours. */
  const history: Float32Array[] = []
  let voice: Float32Array[] | null = null
  let floor = 0.002
  let peak = 0
  let quiet = 0
  let dip = false
  let length = 0
  let startedAt = 0

  function close(now: number) {
    if (!voice) return
    const audio = concat(voice)
    voice = null
    // Moins de 80 ms : un claquement, pas une syllabe.
    if (audio.length < ctx.sampleRate * 0.08) return
    onSyllable({ features: features(downsample(audio, ctx.sampleRate)), start: startedAt, end: now })
  }

  processor.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0)
    const merged = new Float32Array(pending.length + input.length)
    merged.set(pending)
    merged.set(input, pending.length)
    let i = 0
    for (; i + hop <= merged.length; i += hop) {
      const chunk = merged.slice(i, i + hop)
      const rms = Math.sqrt(chunk.reduce((s, v) => s + v * v, 0) / chunk.length)
      const now = performance.now()
      onLevel?.(Math.min(1, rms * 20))
      history.push(chunk)
      if (history.length > 4) history.shift()
      if (!voice) {
        floor = rms < floor ? rms : floor + 0.01 * (rms - floor)
        if (rms > Math.max(floor * 4, 0.01)) {
          voice = [...history]
          startedAt = now - history.length * 10
          peak = rms
          quiet = 0
          dip = false
          length = history.length
        }
        continue
      }
      voice.push(chunk)
      length++
      peak = Math.max(peak, rms)
      if (rms < Math.max(floor * 2, 0.005)) quiet++
      else quiet = 0
      // Creux de voix puis remontée (« do-ré ») : la syllabe s'arrête au creux, la suivante commence.
      if (rms < peak * 0.35) dip = true
      else if (dip && rms > peak * 0.6 && length > 12) {
        voice.pop()
        close(now)
        voice = [chunk]
        startedAt = now
        peak = rms
        dip = false
        length = 1
        continue
      }
      if (quiet >= 8 || length >= 70) close(now)
    }
    pending = merged.slice(i)
  }

  return {
    stop() {
      processor.onaudioprocess = null
      source.disconnect()
      processor.disconnect()
      mute.disconnect()
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}

function concat(parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

const TEMPLATES_KEY = 'harmowhat.soundTemplates'

export function loadTemplates(): Templates {
  try {
    const raw = JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

export function saveTemplates(t: Templates) {
  try {
    // Deux décimales suffisent : la liste reste petite.
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(t, (_k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)))
  } catch {
    // Stockage indisponible : valable pour cette session seulement.
  }
}
