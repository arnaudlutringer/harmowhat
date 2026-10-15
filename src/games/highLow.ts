import { A440, randomInt } from '@/music/notes'
import { currentInstrument, type Instrument } from '@/audio/instruments'

/**
 * « Grave ou aigu ? » : une note est jouée, plus grave ou plus aiguë que le La3 du diapason.
 * Le niveau fixe l'écart minimal avec le La3 : plus il est petit, plus c'est difficile.
 */

export type Level = 'debutant' | 'normal' | 'expert'

export interface LevelConfig {
  label: string
  description: string
  /** Écart minimal avec le La3, en demi-tons. */
  minDistance: number
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: { label: 'Débutant', description: 'Au moins une quarte d’écart avec le La3 : la différence s’entend bien.', minDistance: 5 },
  normal: { label: 'Normal', description: 'Au moins un ton d’écart avec le La3.', minDistance: 2 },
  expert: { label: 'Expert', description: 'Dès un demi-ton d’écart avec le La3 : il faut une oreille fine.', minDistance: 1 },
}

export const QUESTION_COUNTS = [10, 20, 30, 50] as const

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

/**
 * Une note de la tessiture de l'instrument, assez loin du La3 pour le niveau. Grave et aigu sont
 * tirés à pile ou face (quand l'instrument a des notes des deux côtés), pour ne pas favoriser l'un.
 */
export function createHighLowQuestion(level: Level, inst: Instrument = currentInstrument()): number {
  const { minDistance } = LEVELS[level]
  const below = { low: inst.low, high: Math.min(inst.high, A440 - minDistance) }
  const above = { low: Math.max(inst.low, A440 + minDistance), high: inst.high }
  const sides = [below, above].filter((s) => s.low <= s.high)
  const side = sides[randomInt(0, sides.length - 1)] ?? { low: inst.low, high: inst.high }
  return randomInt(side.low, side.high)
}
