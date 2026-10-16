/**
 * Orthographe des notes : une touche noire s'écrit en dièse (La♯) ou en bémol (Si♭).
 * Une note épelée garde sa lettre (Do Ré Mi Fa Sol La Si) et son altération,
 * ce qui permet d'écrire correctement les intervalles et de les dessiner sur une portée.
 */

/** Altération : bémol (−1), dièse (+1) ; double bémol (−2) et double dièse (+2) pour certains intervalles. */
export type Alter = -2 | -1 | 0 | 1 | 2
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
const SIGNS: Record<Alter, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' }
const VEX_SIGNS: Record<Alter, string> = { [-2]: 'bb', [-1]: 'b', 0: '', 1: '#', 2: '##' }

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
 * Renvoie null s'il faudrait une altération plus forte que `maxAlter` (par défaut : pas de double dièse ni double bémol).
 */
export function spellWithLetter(midi: number, letter: number, maxAlter: 1 | 2 = 1): SpelledNote | null {
  let alter = mod12(midi - LETTER_PC[letter])
  if (alter > 6) alter -= 12
  return Math.abs(alter) <= maxAlter ? { midi, letter, alter: alter as Alter } : null
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
  return `${VEX_LETTERS[n.letter]}${VEX_SIGNS[n.alter]}/${scientificOctave(n)}`
}

/** Symbole d'altération VexFlow (#, b, ## ou bb), ou null pour une note naturelle. */
export function vexAccidental(n: SpelledNote): string | null {
  return VEX_SIGNS[n.alter] || null
}
