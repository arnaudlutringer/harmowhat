import { randomInt, shuffle } from '@/music/notes'
import { currentInstrument, rangeFor, type Instrument } from '@/audio/instruments'
import { randomSpelling, spell, spellWithLetter, type SpelledNote } from '@/music/spelling'

/**
 * « Les harmonies » : deux notes jouées l'une après l'autre, on nomme l'intervalle.
 * Précision « simple » : seconde, tierce, quarte... ; « précise » : tierce mineure, quarte augmentée...
 * En expert, on précise aussi le sens (ascendant ou descendant).
 */

export type Level = 'debutant' | 'normal' | 'expert'
export type Precision = 'simple' | 'precise'

export interface Interval {
  /** Écart en demi-tons. */
  semitones: number
  /** Numéro de l'intervalle : 2 = seconde ... 8 = octave. */
  number: number
  quality: 'mineure' | 'majeure' | 'juste' | 'augmentée'
}

export const INTERVALS: Interval[] = [
  { semitones: 1, number: 2, quality: 'mineure' },
  { semitones: 2, number: 2, quality: 'majeure' },
  { semitones: 3, number: 3, quality: 'mineure' },
  { semitones: 4, number: 3, quality: 'majeure' },
  { semitones: 5, number: 4, quality: 'juste' },
  { semitones: 6, number: 4, quality: 'augmentée' },
  { semitones: 7, number: 5, quality: 'juste' },
  { semitones: 8, number: 6, quality: 'mineure' },
  { semitones: 9, number: 6, quality: 'majeure' },
  { semitones: 10, number: 7, quality: 'mineure' },
  { semitones: 11, number: 7, quality: 'majeure' },
  { semitones: 12, number: 8, quality: 'juste' },
]

const NUMBER_NAMES: Record<number, string> = {
  2: 'Seconde', 3: 'Tierce', 4: 'Quarte', 5: 'Quinte', 6: 'Sixte', 7: 'Septième', 8: 'Octave',
}

export interface LevelConfig {
  label: string
  description: string
  /** Intervalles possibles (en demi-tons). */
  semitones: number[]
  /** Nombre de réponses proposées, selon la précision. */
  choices: Record<Precision, number>
  /** Intervalles ascendants et descendants, à préciser dans la réponse. */
  directions: boolean
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: {
    label: 'Débutant',
    description: 'Tierces, quarte, quinte et octave, en montant. 3 propositions.',
    semitones: [3, 4, 5, 7, 12],
    choices: { simple: 3, precise: 3 },
    directions: false,
  },
  normal: {
    label: 'Normal',
    description: "Tous les intervalles jusqu'à l'octave, en montant. 4 à 5 propositions.",
    semitones: INTERVALS.map((i) => i.semitones),
    choices: { simple: 4, precise: 5 },
    directions: false,
  },
  expert: {
    label: 'Expert',
    description: 'Tous les intervalles, en montant ou en descendant : il faut aussi trouver le sens. 6 à 8 propositions.',
    semitones: INTERVALS.map((i) => i.semitones),
    choices: { simple: 6, precise: 8 },
    directions: true,
  },
}

export const PRECISIONS: Record<Precision, { label: string; description: string }> = {
  simple: { label: 'Simple', description: 'Seconde, tierce, quarte, quinte, sixte, septième, octave.' },
  precise: { label: 'Précise', description: 'Avec la qualité : tierce mineure, quarte augmentée, sixte majeure...' },
}

export const QUESTION_COUNTS = [10, 20, 30, 50] as const

export interface IntervalSettings {
  questions: number
  level: Level
  precision: Precision
}

export const DEFAULT_SETTINGS: IntervalSettings = { questions: 20, level: 'normal', precision: 'precise' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown; precision?: unknown }): IntervalSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level)
  const precision = String(raw.precision)
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? (level as Level) : DEFAULT_SETTINGS.level,
    precision: precision in PRECISIONS ? (precision as Precision) : DEFAULT_SETTINGS.precision,
  }
}

export interface Answer {
  id: string
  /** Nom de l'intervalle (sans le sens). */
  label: string
  /** En expert : sens de l'intervalle, affiché par une flèche. */
  direction?: 'up' | 'down'
}

/** Nom d'un intervalle, ex. "Tierce mineure", "Quinte juste", "Octave". */
export function intervalName(i: Interval, precision: Precision): string {
  if (precision === 'simple' || i.number === 8) return NUMBER_NAMES[i.number]
  return `${NUMBER_NAMES[i.number]} ${i.quality}`
}

/**
 * Intervalles jouables pour une précision : en simple, la quarte augmentée (triton) est
 * écartée, car elle est à mi-chemin entre la quarte et la quinte.
 */
export function playableIntervals(level: Level, precision: Precision): Interval[] {
  return INTERVALS.filter((i) => LEVELS[level].semitones.includes(i.semitones) && (precision === 'precise' || i.quality !== 'augmentée'))
}

function answerFor(i: Interval, precision: Precision, ascending: boolean | null): Answer {
  const key = precision === 'simple' ? `n${i.number}` : `s${i.semitones}`
  const name = intervalName(i, precision)
  if (ascending === null) return { id: key, label: name }
  return { id: `${key}${ascending ? '+' : '-'}`, label: name, direction: ascending ? 'up' : 'down' }
}

/** Toutes les réponses possibles pour des réglages (sans doublon). */
export function allAnswers(level: Level, precision: Precision): Answer[] {
  const directions: (boolean | null)[] = LEVELS[level].directions ? [true, false] : [null]
  const seen = new Map<string, Answer>()
  for (const i of playableIntervals(level, precision))
    for (const d of directions) {
      const a = answerFor(i, precision, d)
      seen.set(a.id, a)
    }
  return [...seen.values()]
}

export interface IntervalQuestion {
  interval: Interval
  ascending: boolean
  /** Les deux notes, dans l'ordre où elles sont jouées, correctement écrites. */
  notes: [SpelledNote, SpelledNote]
  answer: Answer
  choices: Answer[]
  picked?: string
}

/** Notes jouées : de Do2 à Do5, limitées à la tessiture de l'instrument. */
export const INTERVAL_LOW = 48
export const INTERVAL_HIGH = 84

export function createIntervalQuestion(settings: IntervalSettings, inst: Instrument = currentInstrument()): IntervalQuestion {
  const { level, precision } = settings
  const cfg = LEVELS[level]
  const range = rangeFor(inst, INTERVAL_LOW, INTERVAL_HIGH)
  const intervals = playableIntervals(level, precision)
  let lower: SpelledNote
  let upper: SpelledNote | null
  let interval: Interval
  // On retire au sort tant que l'écriture demanderait un double dièse ou un double bémol.
  do {
    interval = intervals[randomInt(0, intervals.length - 1)]
    const top = Math.max(range.low, range.high - interval.semitones)
    lower = spell(randomInt(range.low, top), randomSpelling())
    upper = spellWithLetter(lower.midi + interval.semitones, (lower.letter + interval.number - 1) % 7)
  } while (!upper)
  const ascending = cfg.directions ? Math.random() < 0.5 : true
  const answer = answerFor(interval, precision, cfg.directions ? ascending : null)
  const others = shuffle(allAnswers(level, precision).filter((a) => a.id !== answer.id)).slice(0, cfg.choices[precision] - 1)
  // Propositions rangées de la plus petite à la plus grande, comme sur une échelle.
  const order = allAnswers(level, precision).map((a) => a.id)
  const choices = [answer, ...others].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
  return { interval, ascending, notes: ascending ? [lower, upper] : [upper, lower], answer, choices }
}
