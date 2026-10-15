import { randomInt, shuffle } from '@/music/notes'
import { randomSpelling, spell, type SpelledNote } from '@/music/spelling'
import { currentInstrument, rangeFor, type Instrument } from '@/audio/instruments'

/** Tessiture des accords : La2 (220 Hz) à La4 (880 Hz). */
export const CHORD_LOW = 57
export const CHORD_HIGH = 81
export const CHORD_SIZE = 3

export type Level = 'debutant' | 'normal' | 'expert'

export interface LevelConfig {
  label: string
  description: string
  /** Accords parfaits (majeurs ou mineurs) seulement, plutôt que 3 notes au hasard. */
  triadsOnly: boolean
  /** Nombre de notes proposées (dont les 3 bonnes). */
  choices: number
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: { label: 'Débutant', description: 'Accords parfaits, majeurs ou mineurs. 6 notes proposées.', triadsOnly: true, choices: 6 },
  normal: { label: 'Normal', description: 'Trois notes au hasard. 8 notes proposées.', triadsOnly: false, choices: 8 },
  expert: { label: 'Expert', description: 'Trois notes au hasard. 10 notes proposées.', triadsOnly: false, choices: 10 },
}

export const QUESTION_COUNTS = [10, 20, 30, 50] as const

export interface ChordSettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: ChordSettings = { questions: 20, level: 'normal' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): ChordSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level)
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? (level as Level) : DEFAULT_SETTINGS.level,
  }
}

export interface ChordQuestion {
  /** Les notes de l'accord, de la plus grave à la plus aiguë. */
  notes: number[]
  /** Les notes proposées, de la plus grave à la plus aiguë. */
  choices: number[]
  /** Orthographe de chaque note proposée (touches noires en dièse ou en bémol). */
  spelled: Record<number, SpelledNote>
}

const ascending = (a: number, b: number) => a - b

/** Tessiture des accords, limitée à celle de l'instrument. */
export function chordRange(inst: Instrument = currentInstrument()): { low: number; high: number } {
  return rangeFor(inst, CHORD_LOW, CHORD_HIGH)
}

function distinctNotes(count: number, { low, high }: { low: number; high: number }, exclude: number[] = []): number[] {
  const picked = new Set<number>()
  while (picked.size < count) {
    const n = randomInt(low, high)
    if (!exclude.includes(n)) picked.add(n)
  }
  return [...picked]
}

/** Accord parfait majeur ou mineur, à l'état fondamental, dans la tessiture. */
function triad({ low, high }: { low: number; high: number }): number[] {
  const root = randomInt(low, Math.max(low, high - 7))
  return [root, root + (Math.random() < 0.5 ? 3 : 4), root + 7]
}

export function createChordQuestion(level: Level = 'normal', inst: Instrument = currentInstrument()): ChordQuestion {
  const cfg = LEVELS[level]
  const range = chordRange(inst)
  const notes = (cfg.triadsOnly && range.high - range.low >= 7 ? triad(range) : distinctNotes(CHORD_SIZE, range)).sort(ascending)
  const others = distinctNotes(cfg.choices - CHORD_SIZE, range, notes)
  const choices = shuffle([...notes, ...others]).sort(ascending)
  return { notes, choices, spelled: Object.fromEntries(choices.map((m) => [m, spell(m, randomSpelling())])) }
}

export function isCorrect(selected: number[], notes: number[]): boolean {
  return selected.length === notes.length && notes.every((n) => selected.includes(n))
}

/** Clé de sol si l'accord est plutôt aigu (au moins 2 notes à partir du Do3), sinon clé de fa. */
export function clefFor(notes: number[]): 'treble' | 'bass' {
  return notes.filter((n) => n >= 60).length >= 2 ? 'treble' : 'bass'
}
