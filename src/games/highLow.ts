import { A440, randomInt } from '@/music/notes'
import { currentInstrument, type Instrument } from '@/audio/instruments'
import { STANDARD_QUESTION_COUNTS } from './questionCounts'

/**
 * « Grave ou aigu ? » : une note est jouée, plus grave ou plus aiguë qu'une note de référence.
 * En débutant et en normal, la référence est le La3 du diapason ; en expert et en Impossible, c'est une note
 * différente à chaque question, jouée juste avant (on ne peut plus retenir la réponse par cœur).
 * Le niveau fixe l'écart avec la référence : plus il est petit, plus c'est difficile. Le plus petit est le quart de ton.
 */

export type Level = 'debutant' | 'normal' | 'expert' | 'impossible'

export interface LevelConfig {
  label: string
  description: string
  /** Écart minimal avec la référence, en demi-tons. */
  minDistance: number
  /** Écart maximal avec la référence, en demi-tons (sans limite : toute la tessiture). */
  maxDistance?: number
  /** Une note de référence différente à chaque question, jouée avant la note à comparer (sinon le La3). */
  randomReference?: boolean
  /** La référence et la note sont jouées par deux instruments différents, tirés au hasard. */
  twoInstruments?: boolean
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: { label: 'Débutant', description: 'Au moins une quarte d’écart avec le La3 : la différence s’entend bien.', minDistance: 5 },
  normal: { label: 'Normal', description: 'Entre un demi-ton et une quarte d’écart avec le La3.', minDistance: 1, maxDistance: 5 },
  expert: {
    label: 'Expert',
    description: 'Une note de départ différente à chaque question, puis une autre à un demi-ton ou un ton d’écart.',
    minDistance: 1,
    maxDistance: 2,
    randomReference: true,
  },
  impossible: {
    label: 'Impossible',
    description: 'Une note de départ différente à chaque question, puis une autre à un quart de ton seulement, jouées par deux instruments différents.',
    minDistance: 0.5,
    maxDistance: 0.5,
    randomReference: true,
    twoInstruments: true,
  },
}

export const QUESTION_COUNTS = STANDARD_QUESTION_COUNTS

export interface HighLowSettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: HighLowSettings = { questions: 20, level: 'normal' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): HighLowSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level)
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? (level as Level) : DEFAULT_SETTINGS.level,
  }
}

export interface HighLowQuestion {
  /** Note de référence (le La3, ou une note au hasard en expert et en Impossible). */
  reference: number
  /** Note à comparer, plus grave ou plus aiguë que la référence. */
  note: number
}

/** Notes de référence possibles en expert et en Impossible : le médium, de La2 à La4 (du La3, une octave de chaque côté). */
export const REFERENCE_RANGE = { low: A440 - 12, high: A440 + 12 }

/**
 * Une question du niveau, dans la tessiture de l'instrument. Grave et aigu sont tirés à pile ou face
 * (quand l'instrument a des notes des deux côtés), pour ne pas favoriser l'un.
 */
export function createHighLowQuestion(level: Level, inst: Instrument = currentInstrument()): HighLowQuestion {
  const { minDistance, maxDistance, randomReference } = LEVELS[level]
  const span = maxDistance ?? Infinity
  // Référence au hasard : assez loin des bords de la tessiture pour que la note tienne des deux côtés.
  const reference = randomReference
    ? randomInt(Math.max(REFERENCE_RANGE.low, Math.ceil(inst.low + span)), Math.min(REFERENCE_RANGE.high, Math.floor(inst.high - span)))
    : A440
  // Quart de ton : un seul écart possible.
  if (minDistance === span) return { reference, note: reference + (randomInt(0, 1) ? span : -span) }
  const below = { low: Math.max(inst.low, reference - span), high: Math.min(inst.high, reference - minDistance) }
  const above = { low: Math.max(inst.low, reference + minDistance), high: Math.min(inst.high, reference + span) }
  const sides = [below, above].filter((s) => s.low <= s.high)
  const side = sides[randomInt(0, sides.length - 1)] ?? { low: inst.low, high: inst.high }
  return { reference, note: randomInt(Math.ceil(side.low), Math.floor(side.high)) }
}
