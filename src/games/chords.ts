import { randomInt, shuffle } from '@/music/notes'
import { randomSpelling, spell, type SpelledNote } from '@/music/spelling'
import { currentInstrument, rangeFor, type Instrument } from '@/audio/instruments'

/** Tessiture des accords : La2 (220 Hz) à La4 (880 Hz). */
export const CHORD_LOW = 57
export const CHORD_HIGH = 81
export const CHORD_SIZE = 3
/** Nombre de notes proposées (dont les 3 bonnes). */
export const CHOICE_COUNT = 8

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

export function createChordQuestion(inst: Instrument = currentInstrument()): ChordQuestion {
  const range = chordRange(inst)
  const notes = distinctNotes(CHORD_SIZE, range).sort(ascending)
  const others = distinctNotes(CHOICE_COUNT - CHORD_SIZE, range, notes)
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
