import { randomInt } from '@/music/notes'
import { spell, spelledName, spelledPitchName, type Alter, type SpelledNote } from '@/music/spelling'

/**
 * « Lecture de note » : une note est écrite sur une portée, avec une clé ;
 * on la nomme parmi les 12 notes de la gamme (sans l'octave).
 */

export type ClefId = 'sol' | 'fa' | 'ut1' | 'ut3' | 'ut4'

export interface ClefInfo {
  label: string
  /** Nom de la clé pour VexFlow. */
  vex: 'treble' | 'bass' | 'soprano' | 'alto' | 'tenor'
  /** Note de la première ligne (la plus basse), en degrés : lettre + 7 × octave (notation scientifique). */
  bottomLine: number
}

/** Degré d'une lettre à une octave (notation scientifique) : Mi4 (Mi3 en notation française) = 2 + 7 × 4. */
const degree = (letter: number, octave: number) => letter + 7 * octave

export const CLEFS: Record<ClefId, ClefInfo> = {
  sol: { label: 'Clé de sol', vex: 'treble', bottomLine: degree(2, 4) },
  fa: { label: 'Clé de fa', vex: 'bass', bottomLine: degree(4, 2) },
  ut1: { label: "Clé d'ut 1re ligne", vex: 'soprano', bottomLine: degree(0, 4) },
  ut3: { label: "Clé d'ut 3e ligne", vex: 'alto', bottomLine: degree(3, 3) },
  ut4: { label: "Clé d'ut 4e ligne", vex: 'tenor', bottomLine: degree(1, 3) },
}

export type Level = 'debutant' | 'intermediaire' | 'expert'

export interface LevelConfig {
  label: string
  description: string
  clefs: ClefId[]
  /** Lignes supplémentaires au plus, au-dessus ou au-dessous de la portée. */
  ledgerLines: number
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: {
    label: 'Débutant',
    description: 'Clé de sol uniquement.',
    clefs: ['sol'],
    ledgerLines: 1,
  },
  intermediaire: {
    label: 'Intermédiaire',
    description: 'Clés de sol et de fa, au hasard.',
    clefs: ['sol', 'fa'],
    ledgerLines: 2,
  },
  expert: {
    label: 'Expert',
    description: "Toutes les clés : sol, fa, ut 1re ligne, ut 3e ligne et ut 4e ligne, au hasard.",
    clefs: ['sol', 'fa', 'ut1', 'ut3', 'ut4'],
    ledgerLines: 2,
  },
}

export const QUESTION_COUNTS = [10, 20, 30, 50] as const

export interface ReadNoteSettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: ReadNoteSettings = { questions: 20, level: 'debutant' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): ReadNoteSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level) as Level
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? level : DEFAULT_SETTINGS.level,
  }
}

export interface Choice {
  /** Classe de note : 0 = Do ... 11 = Si. */
  pc: number
  /** Libellé du bouton, ex. "Do♯ / Ré♭". */
  label: string
}

/** Les 12 propositions, dans l'ordre de la gamme (de Do à Si) ; une touche noire porte ses deux noms. */
export const CHOICES: Choice[] = Array.from({ length: 12 }, (_, pc) => {
  const sharp = spelledPitchName(spell(pc, 'sharp'))
  const flat = spelledPitchName(spell(pc, 'flat'))
  return { pc, label: sharp === flat ? sharp : `${sharp} / ${flat}` }
})

/** Hauteur des lettres dans l'octave (Do Ré Mi Fa Sol La Si). */
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]

/** Note écrite sur un degré de la portée, avec une altération. */
export function noteAt(step: number, alter: Alter): SpelledNote {
  const letter = ((step % 7) + 7) % 7
  const octave = Math.floor(step / 7)
  return { midi: 12 * (octave + 1) + LETTER_PC[letter] + alter, letter, alter }
}

/** Degrés possibles pour une clé : la portée, plus `ledgerLines` lignes supplémentaires de chaque côté. */
export function stepRange(clef: ClefId, ledgerLines: number): { low: number; high: number } {
  const bottom = CLEFS[clef].bottomLine
  return { low: bottom - 2 * ledgerLines, high: bottom + 8 + 2 * ledgerLines }
}

/**
 * Altération au hasard : une note sur trois environ est altérée. On n'écrit ni Mi♯, ni Fa♭,
 * ni Si♯, ni Do♭ : chaque note altérée est une touche noire.
 */
export function randomAlter(letter: number): Alter {
  if (Math.random() < 0.65) return 0
  const options: Alter[] = []
  if (letter !== 2 && letter !== 6) options.push(1)
  if (letter !== 0 && letter !== 3) options.push(-1)
  return options[randomInt(0, options.length - 1)]
}

export interface Question {
  clef: ClefId
  note: SpelledNote
  /** Classe de la bonne réponse : 0 = Do ... 11 = Si. */
  answer: number
  /** Nom complet de la note écrite, ex. "Si♭3". */
  fullName: string
  picked?: number
}

export function createQuestion(level: Level): Question {
  const cfg = LEVELS[level]
  const clef = cfg.clefs[randomInt(0, cfg.clefs.length - 1)]
  const { low, high } = stepRange(clef, cfg.ledgerLines)
  const step = randomInt(low, high)
  const note = noteAt(step, randomAlter(((step % 7) + 7) % 7))
  return { clef, note, answer: ((note.midi % 12) + 12) % 12, fullName: spelledName(note) }
}
