import { PIANO_HIGHEST, PIANO_LOWEST, randomInt, shuffle } from '@/music/notes'
import { isBlackKey, randomSpelling, spell, spelledName, spelledPitchName } from '@/music/spelling'
import { currentInstrument, rangeFor, type Instrument } from '@/audio/instruments'

export type Level = 'debutant' | 'normal' | 'expert' | 'impossible'

export interface LevelConfig {
  label: string
  description: string
  /** Tessiture des notes jouées (numéros MIDI, bornes incluses). */
  low: number
  high: number
  /** Uniquement les touches blanches (Do Ré Mi Fa Sol La Si). */
  naturalsOnly: boolean
  /** Nombre de propositions affichées, dont la bonne réponse. */
  choices: number
  /** Impossible : un instrument différent à chaque question, et pas de diapason du tout. */
  randomInstrument?: boolean
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: {
    label: 'Débutant',
    description: 'Notes naturelles seulement (Do Ré Mi Fa Sol La Si), dans le médium, 3 propositions.',
    low: 48,
    high: 83,
    naturalsOnly: true,
    choices: 3,
  },
  normal: {
    label: 'Normal',
    description: 'Les 12 notes (en dièse ou en bémol), sur une large étendue, 4 propositions.',
    low: 36,
    high: 95,
    naturalsOnly: false,
    choices: 4,
  },
  expert: {
    label: 'Expert',
    description: "Les 12 notes sur toute la tessiture de l'instrument, 6 propositions.",
    low: PIANO_LOWEST,
    high: PIANO_HIGHEST,
    naturalsOnly: false,
    choices: 6,
  },
  impossible: {
    label: 'Impossible',
    description: 'Les 12 notes en propositions, un instrument différent à chaque question, et aucun diapason, même avant la partie.',
    low: PIANO_LOWEST,
    high: PIANO_HIGHEST,
    naturalsOnly: false,
    choices: 12,
    randomInstrument: true,
  },
}

export const QUESTION_COUNTS = [10, 20, 30, 50] as const

export interface NameTheNoteSettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: NameTheNoteSettings = { questions: 20, level: 'normal' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): NameTheNoteSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level) as Level
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? level : DEFAULT_SETTINGS.level,
  }
}

export interface Question {
  midi: number
  /** Nom de la bonne réponse tel qu'affiché (ex. "Si♭"). */
  answer: string
  /** Nom complet de la note jouée, dans la même orthographe (ex. "Si♭3"). */
  fullName: string
  /**
   * Propositions, dans l'ordre de la gamme (de Do à Si) : chaque note n'apparaît qu'une fois,
   * en dièse ou en bémol (jamais La♯ et Si♭ ensemble).
   */
  choices: string[]
  picked?: string
}

/** Notes jouées pour un niveau, limitées à la tessiture de l'instrument. */
export function levelRange(level: Level, inst: Instrument = currentInstrument()): { low: number; high: number } {
  const { low, high } = LEVELS[level]
  return rangeFor(inst, low, high)
}

export function createQuestion(level: Level, inst: Instrument = currentInstrument()): Question {
  const cfg = LEVELS[level]
  const { low, high } = levelRange(level, inst)
  let midi: number
  do {
    midi = randomInt(low, high)
  } while (cfg.naturalsOnly && isBlackKey(midi))
  const played = spell(midi, randomSpelling())
  const answer = spelledPitchName(played)
  // Les autres propositions sont d'autres classes de notes, donc jamais un doublon enharmonique.
  const answerPc = midi % 12
  const pool = Array.from({ length: 12 }, (_, pc) => pc).filter((pc) => pc !== answerPc && (!cfg.naturalsOnly || !isBlackKey(pc)))
  const others = shuffle(pool)
    .slice(0, cfg.choices - 1)
    .map((pc) => ({ pc, name: spelledPitchName(spell(pc, randomSpelling())) }))
  // Propositions rangées dans l'ordre de la gamme (de Do à Si), de la plus grave à la plus aiguë.
  const choices = [{ pc: answerPc, name: answer }, ...others].sort((a, b) => a.pc - b.pc).map((c) => c.name)
  return { midi, answer, fullName: spelledName(played), choices }
}
