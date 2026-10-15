/**
 * Orthographe des notes : une touche noire s'écrit en dièse (La♯) ou en bémol (Si♭).
 * Une note épelée garde sa lettre (Do Ré Mi Fa Sol La Si) et son altération,
 * ce qui permet d'écrire correctement les intervalles et de les dessiner sur une portée.
 */

export type Alter = -1 | 0 | 1
export type Spelling = 'sharp' | 'flat'

export interface SpelledNote {
  midi: number
  /** Index de la lettre : 0 = Do, 1 = Ré ... 6 = Si. */
  letter: number
  alter: Alter
}

export const LETTERS = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'] as const
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]
const VEX_LETTERS = ['c', 'd', 'e', 'f', 'g', 'a', 'b']
const SIGNS: Record<Alter, string> = { [-1]: '♭', 0: '', 1: '♯' }

const mod12 = (n: number) => ((n % 12) + 12) % 12

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(mod12(midi))
}

export function randomSpelling(): Spelling {
  return Math.random() < 0.5 ? 'sharp' : 'flat'
}

/** Épelle une touche : naturelle pour une touche blanche, en dièse ou en bémol pour une noire. */
export function spell(midi: number, spelling: Spelling = 'sharp'): SpelledNote {
  const pc = mod12(midi)
  if (!isBlackKey(midi)) return { midi, letter: LETTER_PC.indexOf(pc), alter: 0 }
  return spelling === 'sharp'
    ? { midi, letter: LETTER_PC.indexOf(pc - 1), alter: 1 }
    : { midi, letter: LETTER_PC.indexOf(pc + 1), alter: -1 }
}

/**
 * Épelle `midi` avec une lettre imposée (ex. pour écrire un intervalle).
 * Renvoie null s'il faudrait un double dièse ou un double bémol.
 */
export function spellWithLetter(midi: number, letter: number): SpelledNote | null {
  let alter = mod12(midi - LETTER_PC[letter])
  if (alter > 6) alter -= 12
  return Math.abs(alter) <= 1 ? { midi, letter, alter: alter as Alter } : null
}

/** Nom sans octave, ex. "Si♭". */
export function spelledPitchName(n: SpelledNote): string {
  return `${LETTERS[n.letter]}${SIGNS[n.alter]}`
}

/** Octave de la lettre (notation scientifique) : Do♭4 reste à l'octave 4 même s'il sonne comme Si3. */
function scientificOctave(n: SpelledNote): number {
  return Math.floor((n.midi - n.alter) / 12) - 1
}

/** Nom complet en notation française, ex. "Si♭2". */
export function spelledName(n: SpelledNote): string {
  return `${spelledPitchName(n)}${scientificOctave(n) - 1}`
}

/** Clé VexFlow, ex. "bb/3". */
export function vexKeyOf(n: SpelledNote): string {
  return `${VEX_LETTERS[n.letter]}${n.alter === 1 ? '#' : n.alter === -1 ? 'b' : ''}/${scientificOctave(n)}`
}

/** Symbole d'altération VexFlow, ou null pour une note naturelle. */
export function vexAccidental(n: SpelledNote): '#' | 'b' | null {
  return n.alter === 1 ? '#' : n.alter === -1 ? 'b' : null
}
