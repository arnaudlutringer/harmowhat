import { A440 } from '@/music/notes'
import { currentInstrument, fitToRange, nearestSample as nearestInstrumentSample, sampleMidis, type Instrument } from '@/audio/instruments'

/**
 * Moteur audio : de vrais enregistrements de l'instrument choisi par le joueur
 * (voir src/audio/instruments.ts et public/samples/<instrument>/LICENSE.txt),
 * joués via Web Audio. Un échantillon toutes les tierces mineures ; les notes
 * intermédiaires sont obtenues en décalant l'échantillon le plus proche d'un
 * demi-ton au plus. Une note hors de la tessiture (musiques de fin) est
 * ramenée dans la tessiture à l'octave près.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
const buffers = new Map<string, Promise<AudioBuffer>>()

function audio(): { ctx: AudioContext; out: GainNode } {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)
  }
  // Les navigateurs (et iOS) suspendent l'audio tant qu'il n'y a pas eu de geste utilisateur.
  if (ctx.state === 'suspended') void ctx.resume()
  return { ctx, out: master! }
}

/**
 * Contexte audio de l'appli, déjà débloqué par les touchers précédents : le micro s'y branche
 * (iOS laisse en pause un contexte créé hors d'un geste du joueur).
 */
export function audioContext(): AudioContext {
  return audio().ctx
}

function nearestSample(midi: number, inst: Instrument = currentInstrument()): number {
  return nearestInstrumentSample(inst, fitToRange(inst, midi))
}

function loadSample(sample: number, inst: Instrument = currentInstrument()): Promise<AudioBuffer> {
  const key = `${inst.id}/${sample}`
  let p = buffers.get(key)
  if (!p) {
    const { ctx } = audio()
    p = fetch(`${import.meta.env.BASE_URL}samples/${key}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
    p.catch(() => buffers.delete(key))
    buffers.set(key, p)
  }
  return p
}

/** Charge tous les échantillons (à appeler tôt pour éviter un délai au premier clic). */
export function preloadPiano(): Promise<void> {
  return Promise.all(sampleMidis(currentInstrument()).map((s) => loadSample(s))).then(() => undefined)
}

interface PlayOptions {
  /** Départ, en secondes après l'instant de référence. */
  when?: number
  /** Durée avant la fin du fondu de sortie, en secondes. */
  duration?: number
  /** Durée du fondu d'entrée, en secondes (0 = attaque naturelle du piano). */
  fadeIn?: number
  /** Durée du fondu de sortie, en secondes. */
  fadeOut?: number
  velocity?: number
  /** Instrument qui joue (par défaut celui choisi par le joueur). */
  instrument?: Instrument
  /** Départ dans l'échantillon, en secondes (pour sauter une attaque lente). */
  offset?: number
}

function schedule(buffer: AudioBuffer, sample: number, midi: number, at: number, o: PlayOptions): Voice {
  const { ctx, out } = audio()
  const { duration = 2.5, fadeIn = 0, fadeOut = 0.4, velocity = 0.8, instrument: inst = currentInstrument(), offset = 0 } = o
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.playbackRate.value = Math.pow(2, (fitToRange(inst, midi) - sample) / 12)
  const g = ctx.createGain()
  const peak = velocity * inst.gain
  if (fadeIn > 0) {
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(peak, at + fadeIn)
  } else {
    g.gain.setValueAtTime(peak, at)
  }
  g.gain.setValueAtTime(peak, at + Math.max(fadeIn, duration - fadeOut))
  g.gain.linearRampToValueAtTime(0, at + duration)
  src.connect(g).connect(out)
  src.start(at, offset)
  src.stop(at + duration + 0.05)
  const voice = { src, gain: g }
  active.add(voice)
  src.onended = () => active.delete(voice)
  return voice
}

interface Voice {
  src: AudioBufferSourceNode
  gain: GainNode
}

// Sons en cours ou programmés, pour pouvoir tout couper au changement d'écran.
const active = new Set<Voice>()
const stopListeners = new Set<() => void>()
let generation = 0

function fadeOutVoices(voices: Iterable<Voice>) {
  if (!ctx) return
  const now = ctx.currentTime
  for (const { src, gain } of voices) {
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.08)
    try {
      src.stop(now + 0.1)
    } catch {
      // Déjà arrêtée.
    }
  }
}

/** Coupe tous les sons (notes, accords, diapason, morceaux), y compris ceux encore en chargement. */
export function stopAll(): void {
  generation++
  fadeOutVoices(active)
  active.clear()
  stopListeners.forEach((fn) => fn())
}

/** Prévient quand tout est coupé (pour éteindre les effets visuels). Renvoie de quoi se désabonner. */
export function onStopAll(fn: () => void): () => void {
  stopListeners.add(fn)
  return () => stopListeners.delete(fn)
}

/** Joue une note (numéro MIDI) avec l'instrument choisi. Renvoie la durée jouée, en secondes. */
export async function playPiano(midi: number, options: PlayOptions = {}): Promise<number> {
  const sample = nearestSample(midi)
  const gen = generation
  const buffer = await loadSample(sample)
  if (gen !== generation) return 0
  const { ctx } = audio()
  schedule(buffer, sample, midi, ctx.currentTime + (options.when ?? 0), options)
  return options.duration ?? 2.5
}

/** Joue plusieurs touches en même temps (un accord). */
export async function playChord(midis: number[], options: PlayOptions = {}): Promise<number> {
  const gen = generation
  const buffers = await Promise.all(midis.map((m) => loadSample(nearestSample(m))))
  if (gen !== generation) return 0
  const { ctx } = audio()
  const at = ctx.currentTime + 0.02 + (options.when ?? 0)
  midis.forEach((m, i) => schedule(buffers[i], nearestSample(m), m, at, { velocity: 0.6, ...options }))
  return options.duration ?? 2.5
}

/** Une note d'une séquence ; temps et durée en unités (ex. doubles croches). */
export interface SequenceNote {
  midi: number
  at: number
  len: number
  /** Volume propre à cette note (sinon celui de la séquence). */
  velocity?: number
  /** Coup de tambour (décompte des jeux de rythme) au lieu d'une note de l'instrument ; `midi` est ignoré. */
  drum?: boolean
}

let drum: AudioBuffer | undefined

/** Coup de tambour synthétisé une fois : une peau grave qui descend (sinus de 190 à 70 Hz) et un claquement de bruit. */
function drumBuffer(ctx: AudioContext): AudioBuffer {
  if (drum) return drum
  const rate = ctx.sampleRate
  const buffer = ctx.createBuffer(1, Math.round(rate * 0.35), rate)
  const data = buffer.getChannelData(0)
  let phase = 0
  for (let i = 0; i < data.length; i++) {
    const t = i / rate
    phase += (2 * Math.PI * (70 + 120 * Math.exp(-t * 25))) / rate
    const body = Math.sin(phase) * Math.exp(-t * 9)
    const snap = (Math.random() * 2 - 1) * Math.exp(-t * 45) * 0.5
    data[i] = (body + snap) * 0.9
  }
  return (drum = buffer)
}

function scheduleDrum(at: number, velocity: number): Voice {
  const { ctx, out } = audio()
  const src = ctx.createBufferSource()
  src.buffer = drumBuffer(ctx)
  const g = ctx.createGain()
  g.gain.value = velocity * 1.6
  src.connect(g).connect(out)
  src.start(at)
  const voice = { src, gain: g }
  active.add(voice)
  src.onended = () => active.delete(voice)
  return voice
}

export interface Playback {
  /** Durée totale, en secondes. */
  duration: number
  /**
   * Instant (performance.now(), en ms) où le début de la séquence sort du haut-parleur, latence de sortie
   * comprise : pour comparer des frappes au rythme entendu.
   */
  startedAt: number
  /** Coupe la lecture (fondu très court). */
  stop: () => void
}

/**
 * Joue une séquence de notes, `unit` étant la durée d'une unité en secondes,
 * avec l'instrument choisi par le joueur ou celui indiqué.
 */
export async function playSequence(
  notes: readonly SequenceNote[],
  unit: number,
  velocity = 0.55,
  instrument: Instrument = currentInstrument(),
): Promise<Playback> {
  const gen = generation
  const loaded = await Promise.all(notes.map(({ midi, drum }) => (drum ? null : loadSample(nearestSample(midi, instrument), instrument))))
  if (gen !== generation) return { duration: 0, startedAt: performance.now(), stop() {} }
  const { ctx } = audio()
  const t0 = ctx.currentTime + 0.05
  const latency = (ctx.outputLatency || 0) + (ctx.baseLatency || 0)
  const startedAt = performance.now() + (t0 - ctx.currentTime + latency) * 1000
  const { legato } = instrument
  const voices = notes.map((n, i) => {
    const buffer = loaded[i]
    if (!buffer) return scheduleDrum(t0 + n.at * unit, n.velocity ?? velocity)
    // Lié (chœur) : chaque note démarre après son attaque et déborde sur la suivante, qui entre en fondu.
    const duration = Math.max(0.3, n.len * unit + (legato?.overlap ?? 0.15))
    return schedule(buffer, nearestSample(n.midi, instrument), n.midi, t0 + n.at * unit, {
      duration,
      fadeIn: legato ? 0.06 : 0,
      fadeOut: Math.min(legato ? legato.overlap : 0.4, duration / 2),
      velocity: n.velocity ?? velocity,
      instrument,
      offset: legato?.offset,
    })
  })
  return {
    duration: Math.max(0, ...notes.map(({ at, len }) => at + len)) * unit + 0.2,
    startedAt,
    stop() {
      fadeOutVoices(voices)
      voices.forEach((v) => active.delete(v))
    },
  }
}

/**
 * Joue un enregistrement (fichier de public/, ex. `music/morceau.mp3`) pendant `seconds` au plus,
 * avec un fondu de sortie. Coupé comme les autres sons par stopAll. Renvoie la durée jouée, en secondes.
 */
export async function playRecording(path: string, seconds: number, velocity = 0.8): Promise<number> {
  const gen = generation
  let p = buffers.get(path)
  if (!p) {
    const { ctx } = audio()
    p = fetch(`${import.meta.env.BASE_URL}${path}`)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
    p.catch(() => buffers.delete(path))
    buffers.set(path, p)
  }
  const buffer = await p
  if (gen !== generation) return 0
  const { ctx, out } = audio()
  const at = ctx.currentTime + 0.05
  const duration = Math.min(seconds, buffer.duration)
  const fadeOut = Math.min(1.5, duration / 4)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const g = ctx.createGain()
  g.gain.setValueAtTime(velocity, at)
  g.gain.setValueAtTime(velocity, at + duration - fadeOut)
  g.gain.linearRampToValueAtTime(0, at + duration)
  src.connect(g).connect(out)
  src.start(at)
  src.stop(at + duration + 0.05)
  const voice = { src, gain: g }
  active.add(voice)
  src.onended = () => active.delete(voice)
  return duration
}

/** Un petit arpège au milieu de la tessiture d'un instrument, pour l'entendre. */
export function playArpeggio(inst: Instrument): Promise<number> {
  const root = Math.round((inst.low + inst.high) / 2) - 6
  const arpeggio = [0, 4, 7, 12, 7, 4, 0].map((d, i) => ({ midi: root + d, at: i, len: i === 6 ? 3 : 1.2 }))
  return playSequence(arpeggio, 0.22, undefined, inst).then((p) => p.duration)
}

/** Diapason : La3 (440 Hz) joué par l'instrument choisi, 2 s, avec fondu d'ouverture et de fermeture. */
export function playTuningFork(): Promise<number> {
  return playPiano(A440, { duration: 2, fadeIn: 0.15, fadeOut: 0.5 })
}

export type ResultTier = 'great' | 'good' | 'poor'

export function tierForScore(score: number, total: number): ResultTier {
  const ratio = total ? score / total : 0
  if (ratio >= 0.8) return 'great'
  if (ratio >= 0.5) return 'good'
  return 'poor'
}
