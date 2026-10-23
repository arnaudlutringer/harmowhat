import { randomInt } from '@/music/notes'
import { randomSpelling, spell, spellWithLetter, type SpelledNote } from '@/music/spelling'
import { centsFromPitchClass, midiOf } from '@/audio/pitch'
import { INTERVALS, intervalName, type Interval } from './intervals'

/**
 * « Chante l'harmonie » : une note de l'octave 3 est jouée, et le joueur chante la note qui forme avec
 * elle l'intervalle demandé (ex. « la quarte augmentée ascendante »). Comme pour « Chante la note »,
 * la note chantée est jugée à l'octave près, chacun chantant dans sa voix.
 */

export type Level = 'debutant' | 'normal' | 'expert'

export interface LevelConfig {
  label: string
  description: string
  /** Intervalles possibles (en demi-tons). */
  semitones: number[]
  /** Intervalles descendants aussi. */
  descending: boolean
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: {
    label: 'Débutant',
    description: 'Tierce majeure, quarte juste, quinte juste et octave, en montant.',
    semitones: [4, 5, 7, 12],
    descending: false,
  },
  normal: {
    label: 'Normal',
    description: "Tous les intervalles jusqu'à l'octave, en montant.",
    semitones: INTERVALS.map((i) => i.semitones),
    descending: false,
  },
  expert: {
    label: 'Expert',
    description: 'Tous les intervalles, en montant ou en descendant.',
    semitones: INTERVALS.map((i) => i.semitones),
    descending: true,
  },
}

/** Écart toléré avec la note attendue, en cents : il s'agit de trouver la note, pas de chanter au cent près. */
export const TOLERANCE = 50

export const QUESTION_COUNTS = [5, 10, 20] as const

export interface SingHarmonySettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: SingHarmonySettings = { questions: 10, level: 'normal' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): SingHarmonySettings {
  const questions = Number(raw.questions)
  const level = String(raw.level)
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? (level as Level) : DEFAULT_SETTINGS.level,
  }
}

/** La note de départ est tirée dans l'octave 3 : de Do3 à Si3. */
export const BASE_LOW = 60
export const BASE_HIGH = 71

export interface Question {
  interval: Interval
  ascending: boolean
  /** Note jouée, puis note à chanter, correctement écrites. */
  base: SpelledNote
  target: SpelledNote
  /** Consigne, ex. "la quarte augmentée ascendante". */
  label: string
}

export function createQuestion(level: Level): Question {
  const cfg = LEVELS[level]
  const intervals = INTERVALS.filter((i) => cfg.semitones.includes(i.semitones))
  let interval: Interval
  let ascending: boolean
  let base: SpelledNote
  let target: SpelledNote | null
  // On retire au sort tant que l'écriture demanderait un double dièse ou un double bémol.
  do {
    interval = intervals[randomInt(0, intervals.length - 1)]
    ascending = !cfg.descending || Math.random() < 0.5
    base = spell(randomInt(BASE_LOW, BASE_HIGH), randomSpelling())
    const steps = interval.number - 1
    const letter = (base.letter + (ascending ? steps : 7 - steps)) % 7
    target = spellWithLetter(base.midi + (ascending ? 1 : -1) * interval.semitones, letter)
  } while (!target)
  const name = intervalName(interval, 'precise').toLowerCase()
  const label = `${interval.number === 8 ? "l'" : 'la '}${name} ${ascending ? 'ascendante' : 'descendante'}`
  return { interval, ascending, base, target, label }
}

export interface Verdict {
  /** Note chantée, ramenée à l'octave de la note attendue (pour la portée). */
  sung: SpelledNote
  /** Écart avec la note attendue, en cents, à l'octave près (positif : trop haut). */
  cents: number
  correct: boolean
}

export function judge(frequency: number, q: Question): Verdict {
  const midi = midiOf(frequency)
  const cents = centsFromPitchClass(midi, q.target.midi % 12)
  const correct = Math.abs(cents) <= TOLERANCE
  // Sur la portée, la note chantée est placée au plus près de la note attendue, dans la même orthographe.
  const sungMidi = q.target.midi + Math.round(cents / 100)
  const sung = correct ? q.target : spell(sungMidi, q.target.alter < 0 ? 'flat' : 'sharp')
  return { sung, cents, correct }
}
