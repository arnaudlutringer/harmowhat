/**
 * Notes du piano, numérotées en MIDI (21 = La0 ... 108 = Do8).
 * Convention française : La3 = 440 Hz (= A4 en notation anglo-saxonne),
 * donc octave française = octave scientifique - 1.
 */

export const PIANO_LOWEST = 21 // La0 (A0), 27,5 Hz
export const PIANO_HIGHEST = 108 // Do8 (C8), 4186 Hz
export const A440 = 69 // La3

export const NOTE_NAMES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'] as const

export function frequency(midi: number): number {
  return 440 * Math.pow(2, (midi - A440) / 12)
}

/** Nom sans octave, ex. "Ré♯". */
export function pitchClassName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12]
}

/** Octave en notation française (Do3 ... Si3 contient La3 = 440 Hz). */
export function frenchOctave(midi: number): number {
  return Math.floor(midi / 12) - 2
}

/** Nom complet, ex. "La3". */
export function noteName(midi: number): string {
  return `${pitchClassName(midi)}${frenchOctave(midi)}`
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Une touche aléatoire du piano, en excluant éventuellement certaines notes. */
export function randomPianoNote(exclude: number[] = []): number {
  let n: number
  do {
    n = randomInt(PIANO_LOWEST, PIANO_HIGHEST)
  } while (exclude.includes(n))
  return n
}
