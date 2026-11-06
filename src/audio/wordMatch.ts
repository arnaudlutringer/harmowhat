import { audioContext } from './engine'
import { detectPitch } from './pitch'

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

/** Cosinus et sinus de la transformée de Fourier, calculés une fois. */
const COS = Float64Array.from({ length: FFT / 2 }, (_, k) => Math.cos((-2 * Math.PI * k) / FFT))
const SIN = Float64Array.from({ length: FFT / 2 }, (_, k) => Math.sin((-2 * Math.PI * k) / FFT))

/** Transformée de Fourier (sur place, taille FFT). */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      let t = re[i]
      re[i] = re[j]
      re[j] = t
      t = im[i]
      im[i] = im[j]
      im[j] = t
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const stride = n / len
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = COS[k * stride]
        const wi = SIN[k * stride]
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

/** Bancs de filtres triangulaires sur l'échelle des mels (80 à 7 600 Hz) : premier point du spectre et poids. */
const FILTERS: { from: number; weights: Float64Array }[] = (() => {
  const low = mel(80)
  const high = mel(7600)
  const points = Array.from({ length: MELS + 2 }, (_, i) => Math.floor(((FFT + 1) * hzOf(low + ((high - low) * i) / (MELS + 1))) / RATE))
  return Array.from({ length: MELS }, (_, m) => {
    const [a, b, c] = [points[m], points[m + 1], points[m + 2]]
    const weights = new Float64Array(Math.max(1, c - a))
    for (let k = a; k < b; k++) weights[k - a] = (k - a) / Math.max(1, b - a)
    for (let k = b; k < c; k++) weights[k - a] = (c - k) / Math.max(1, c - b)
    return { from: a, weights }
  })
})()

const WINDOW = Float64Array.from({ length: FRAME }, (_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (FRAME - 1)))
/** Matrice de la transformée en cosinus (énergies des filtres → coefficients). */
const DCT = Array.from({ length: COEFFS }, (_, c) => Float64Array.from({ length: MELS }, (_, m) => Math.cos((Math.PI * (c + 1) * (m + 0.5)) / MELS)))

/** Coefficients cepstraux d'un son à 16 kHz, centrés (la couleur du micro et de la pièce s'efface). */
export function features(samples: Float32Array): Features {
  const frames: number[][] = []
  const re = new Float64Array(FFT)
  const im = new Float64Array(FFT)
  const power = new Float64Array(FFT / 2 + 1)
  const energies = new Float64Array(MELS)
  for (let start = 0; start + FRAME <= samples.length; start += HOP) {
    re.fill(0)
    im.fill(0)
    for (let i = 0; i < FRAME; i++) re[i] = (samples[start + i] - (i ? 0.97 * samples[start + i - 1] : 0)) * WINDOW[i]
    fft(re, im)
    for (let k = 0; k < power.length; k++) power[k] = re[k] * re[k] + im[k] * im[k]
    for (let m = 0; m < MELS; m++) {
      const { from, weights } = FILTERS[m]
      let sum = 1e-10
      for (let k = 0; k < weights.length; k++) sum += weights[k] * power[from + k]
      energies[m] = Math.log(sum)
    }
    const coeffs: number[] = []
    for (let c = 0; c < COEFFS; c++) {
      let sum = 0
      for (let m = 0; m < MELS; m++) sum += energies[m] * DCT[c][m]
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
  const x = flat(a)
  const y = flat(b)
  const n = a.length
  const m = b.length
  let prev = new Float64Array(m + 1).fill(Infinity)
  let cur = new Float64Array(m + 1)
  prev[0] = 0
  for (let i = 1; i <= n; i++) {
    cur[0] = Infinity
    const xi = (i - 1) * COEFFS
    for (let j = 1; j <= m; j++) {
      const yj = (j - 1) * COEFFS
      let d = 0
      for (let c = 0; c < COEFFS; c++) {
        const diff = x[xi + c] - y[yj + c]
        d += diff * diff
      }
      const before = prev[j] < cur[j - 1] ? prev[j] : cur[j - 1]
      cur[j] = Math.sqrt(d) + (before < prev[j - 1] ? before : prev[j - 1])
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[m] / (n + m)
}

/** Coefficients d'une syllabe à plat (calculés une fois par syllabe) : la comparaison va bien plus vite. */
const flats = new WeakMap<Features, Float64Array>()
function flat(f: Features): Float64Array {
  let out = flats.get(f)
  if (!out) {
    out = new Float64Array(f.length * COEFFS)
    f.forEach((row, i) => row.forEach((v, c) => c < COEFFS && (out![i * COEFFS + c] = v)))
    flats.set(f, out)
  }
  return out
}

/** Au-delà de 400 ms d'un seul tenant, un son est sans doute fait de deux syllabes : on le coupe à son creux (loin des bords). */
const LONG_HOPS = 40
const EDGE_HOPS = 12

/** Mesure du bruit ambiant au début de l'écoute (rien n'est découpé pendant ce temps). */
export const AMBIENT_MS = 800
/** Une syllabe doit dépasser le bruit ambiant (ses pointes) de ce facteur pour commencer. */
const AMBIENT_FACTOR = 2.5

/** Un son sans voix qui finit moins de 120 ms avant une syllabe en est la consonne (« s » de « si », « sol »). */
const CONSONANT_GAP_MS = 120

/** Syllabe la plus courte retenue (en dessous : bruit, souffle, bout de mot). */
export const MIN_SYLLABLE_MS = 180
/** Écart minimal entre la note la plus proche et la suivante pour répondre (sinon : pas sûr). */
export const MIN_MARGIN = 1

/** Durée de voix « chantée » (son régulier, avec une hauteur) exigée dans une syllabe : souffle et toux n'en ont presque pas. */
export const MIN_VOICED_MS = 45
/** Au-delà de cette part de la distance habituelle entre deux enregistrements d'un même mot : ce n'est aucun des mots. */
const NOISE_FACTOR = 1.8
/** Écart à partir duquel un mot se détache nettement des autres. */
const CLEAR_MARGIN = 3

/**
 * Durée de voix avec une hauteur nette dans un son à 16 kHz : fenêtres de 30 ms qui se chevauchent (une toutes les
 * 15 ms), pour ne pas manquer la voyelle brève d'un « ré » dit vite.
 */
export function voicedMs(samples: Float32Array): number {
  const win = 480
  const step = 240
  let voiced = 0
  for (let start = 0; start + win <= samples.length; start += step) {
    const p = detectPitch(samples.subarray(start, start + win), RATE)
    if (p && p.clarity >= 0.65 && p.frequency >= 70 && p.frequency <= 500) voiced++
  }
  return voiced * 15
}

/** Enregistrements du joueur : plusieurs par syllabe. */
export type Templates = Record<string, Features[]>

/** Distance habituelle entre deux enregistrements d'un même mot (moyenne), ou Infinity s'il n'y en a qu'un par mot. */
const spreads = new WeakMap<Templates, number>()
function spread(templates: Templates): number {
  let s = spreads.get(templates)
  if (s === undefined) {
    const pairs: number[] = []
    for (const list of Object.values(templates)) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) pairs.push(distance(list[i], list[j]))
    s = pairs.length ? pairs.reduce((a, b) => a + b, 0) / pairs.length : Infinity
    spreads.set(templates, s)
  }
  return s
}

/** Chaque mot enregistré, du plus proche au plus loin de la syllabe (sa distance : celle de son meilleur enregistrement). */
export function ranked(f: Features, templates: Templates): { key: string; distance: number }[] {
  return Object.entries(templates)
    .map(([key, list]) => ({ key, distance: Math.min(...list.map((t) => distance(f, t))) }))
    .filter((r) => Number.isFinite(r.distance))
    .sort((x, y) => x.distance - y.distance)
}

/** Distance au-delà de laquelle un son est loin de tous les enregistrements. */
export const noiseLimit = (templates: Templates) => spread(templates) * NOISE_FACTOR

/**
 * La syllabe la plus proche parmi les enregistrements, avec sa distance et l'écart avec la suivante ;
 * `noise` : elle est bien plus loin que deux enregistrements d'un même mot entre eux (un bruit, pas un nom de note).
 */
export function closest(
  f: Features,
  templates: Templates,
  /** Sens de chaque enregistrement : l'écart se mesure avec le plus proche d'un autre sens. */
  meaning: (key: string) => string = (k) => k,
): { key: string; distance: number; margin: number; noise: boolean } | null {
  const best = ranked(f, templates)
  if (!best.length) return null
  const d = best[0].distance
  const other = best.find((r) => meaning(r.key) !== meaning(best[0].key))
  const margin = (other?.distance ?? Infinity) - d
  // Loin de tous les enregistrements, et sans mot qui se détache nettement : un bruit. Un mot qui se détache (grand écart)
  // est gardé, même un peu loin (voix plus fatiguée, plus rapide…).
  return { key: best[0].key, distance: d, margin, noise: d > spread(templates) * NOISE_FACTOR && margin < CLEAR_MARGIN }
}

/** Une syllabe découpée dans le son du micro, avec l'instant de son début et de sa fin (performance.now()). */
export interface Syllable {
  features: Features
  /** Durée de voix avec une hauteur nette, en ms (presque nulle pour un souffle ou une toux). */
  voiced: number
  start: number
  end: number
}

export interface SyllableListening {
  stop: () => void
}

/** Creux de voix entre deux syllabes : longueur minimale de la syllabe (en 10 ms), profondeur du creux et remontée qui suit. */
export const CUT_RULES = { minHops: 18, dip: 0.55, rise: 1.8, back: 0.45 }

/** Réglages du micro pour la reconnaissance par le son (les mêmes pour le jeu, « Ma voix » et le banc d'essai). */
export const SOUND_MIC: MediaTrackConstraints = { echoCancellation: false, noiseSuppression: true, autoGainControl: true }

/**
 * Découpe un son en syllabes : une syllabe commence quand l'énergie monte nettement au-dessus du bruit de fond, et finit
 * après 60 ms de silence, à un creux de voix (notes enchaînées) ou au bout de 700 ms. Ne dépend ni du micro ni de l'horloge :
 * le banc d'essai y rejoue un enregistrement.
 */
export class SyllableCutter {
  private hop: number
  private pending = new Float32Array(0)
  /** Son récent (pour garder un peu avant l'attaque) et son de la syllabe en cours. */
  private history: Float32Array[] = []
  private voice: Float32Array[] | null = null
  /** Énergie de chaque morceau de 10 ms de la syllabe en cours (pour la couper à son creux). */
  private levels: number[] = []
  private floor = 0.002
  private peak = 0
  private dipMin = 0
  private quiet = 0
  private length = 0
  private startedAt = 0
  private lastLevel = 0
  // Bruit ambiant (gymnase, voix autour) : mesuré pendant la première seconde, une syllabe doit ensuite le dépasser
  // nettement pour commencer (la voix du joueur, proche du micro, est bien plus forte).
  private ambient: number[] = []
  private listenedFrom: number | null = null
  private threshold = 0.01
  /**
   * Son sans voix (un « s », un « ch ») gardé un instant : s'il est suivi de près d'une syllabe avec de la voix, c'est
   * sa consonne (« s » + « i » = « si »), et les deux sont réunis ; sinon c'est un souffle.
   */
  private unvoiced: { chunks: Float32Array[]; start: number; end: number } | null = null

  constructor(
    private rate: number,
    private onSyllable: (s: Syllable) => void,
    private onLevel?: (level: number) => void,
  ) {
    this.hop = Math.round((rate * HOP) / RATE)
  }

  private emit(chunks: Float32Array[], start: number, end: number) {
    let audio = concat(chunks)
    let low = downsample(audio, this.rate)
    const voiced = voicedMs(low)
    if (voiced < MIN_VOICED_MS) {
      this.unvoiced = { chunks, start, end }
      return
    }
    if (this.unvoiced && start - this.unvoiced.end < CONSONANT_GAP_MS) {
      audio = concat([...this.unvoiced.chunks, ...chunks])
      low = downsample(audio, this.rate)
      start = this.unvoiced.start
    }
    this.unvoiced = null
    // Trop court : un claquement, un souffle ou un bout de mot, pas une syllabe.
    if (audio.length < (this.rate * MIN_SYLLABLE_MS) / 1000) return
    this.onSyllable({ features: features(low), voiced, start, end })
  }

  private close(now: number) {
    if (!this.voice) return
    const chunks = this.voice
    const lv = this.levels
    this.voice = null
    this.levels = []
    // Long son d'un seul tenant (« si-bémol » dit d'un trait) : coupé en deux au creux d'énergie le plus net du milieu.
    if (chunks.length > LONG_HOPS) {
      let cut = -1
      for (let i = EDGE_HOPS; i < chunks.length - EDGE_HOPS; i++) if (cut < 0 || lv[i] < lv[cut]) cut = i
      const top = Math.max(...lv)
      if (cut > 0 && lv[cut] < top * 0.6) {
        const middle = this.startedAt + cut * 10
        this.emit(chunks.slice(0, cut), this.startedAt, middle)
        this.emit(chunks.slice(cut), middle, now)
        return
      }
    }
    this.emit(chunks, this.startedAt, now)
  }

  /** Nouveau son du micro ; `time` : l'instant de sa fin, en ms. */
  push(input: Float32Array, time: number) {
    const merged = new Float32Array(this.pending.length + input.length)
    merged.set(this.pending)
    merged.set(input, this.pending.length)
    const msPerSample = 1000 / this.rate
    let i = 0
    for (; i + this.hop <= merged.length; i += this.hop) {
      const chunk = merged.slice(i, i + this.hop)
      let energy = 0
      for (let k = 0; k < chunk.length; k++) energy += chunk[k] * chunk[k]
      const rms = Math.sqrt(energy / chunk.length)
      const now = time - (merged.length - i - this.hop) * msPerSample
      this.listenedFrom ??= now
      // Niveau pour l'affichage : 20 fois par seconde suffisent.
      if (now - this.lastLevel > 50) {
        this.lastLevel = now
        this.onLevel?.(Math.min(1, rms * 20))
      }
      this.history.push(chunk)
      if (this.history.length > 4) this.history.shift()
      if (now - this.listenedFrom < AMBIENT_MS) {
        this.ambient.push(rms)
        continue
      }
      if (this.ambient.length) {
        const sorted = [...this.ambient].sort((a, b) => a - b)
        this.threshold = Math.max(0.01, sorted[Math.floor(sorted.length * 0.9)] * AMBIENT_FACTOR)
        this.ambient.length = 0
      }
      if (!this.voice) {
        this.floor = rms < this.floor ? rms : this.floor + 0.01 * (rms - this.floor)
        if (rms > Math.max(this.floor * 4, this.threshold)) {
          this.voice = [...this.history]
          this.levels = this.history.map(() => rms)
          this.startedAt = now - this.history.length * 10
          this.peak = rms
          this.dipMin = rms
          this.quiet = 0
          this.length = this.history.length
        }
        continue
      }
      this.voice.push(chunk)
      this.levels.push(rms)
      this.length++
      if (rms > this.peak) {
        this.peak = rms
        this.dipMin = rms
      } else this.dipMin = Math.min(this.dipMin, rms)
      if (rms < Math.max(this.floor * 2, 0.005)) this.quiet++
      else this.quiet = 0
      // Creux de voix puis remontée (« do-ré », « si-bé-mol ») : la syllabe s'arrête au creux, la suivante commence.
      if (this.length > CUT_RULES.minHops && this.dipMin < this.peak * CUT_RULES.dip && rms > this.dipMin * CUT_RULES.rise && rms > this.peak * CUT_RULES.back) {
        this.voice.pop()
        this.levels.pop()
        this.close(now)
        this.voice = [chunk]
        this.levels = [rms]
        this.startedAt = now
        this.peak = rms
        this.dipMin = rms
        this.length = 1
        continue
      }
      // Fin de syllabe après 60 ms de silence : la réponse part vite.
      if (this.quiet >= 6 || this.length >= 70) this.close(now)
    }
    this.pending = merged.slice(i)
  }
}

/** Écoute le micro et découpe la voix en syllabes. `onLevel` reçoit le niveau (0 à 1) pour l'affichage. */
export async function listenToSyllables(onSyllable: (s: Syllable) => void, onLevel?: (level: number) => void): Promise<SyllableListening> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro indisponible')
  const stream = await navigator.mediaDevices.getUserMedia({ audio: SOUND_MIC })
  const ctx = audioContext()
  const source = ctx.createMediaStreamSource(stream)
  const processor = ctx.createScriptProcessor(1024, 1, 1)
  const mute = ctx.createGain()
  mute.gain.value = 0
  source.connect(processor)
  processor.connect(mute)
  mute.connect(ctx.destination)
  const cutter = new SyllableCutter(ctx.sampleRate, onSyllable, onLevel)
  processor.onaudioprocess = (e) => cutter.push(e.inputBuffer.getChannelData(0), performance.now())

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
