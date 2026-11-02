import { randomInt } from '@/music/notes'
import { LETTERS, type Alter } from '@/music/spelling'
import { CLEFS, type ClefId } from './readNote'

/**
 * « La tonalité » : une portée montre une armure (dièses, bémols ou rien) ; on trouve la tonalité.
 * Une armure correspond à une tonalité majeure et à sa relative mineure : la question précise donc le mode
 * (« Quelle est la tonalité Majeure ? » ou « … mineure ? »), et seules les tonalités de ce mode sont proposées.
 */

export { CLEFS }

export type Mode = 'M' | 'm'

export interface Key {
  /** Identifiant, ex. « fa#-M », « sib-m ». */
  id: string
  mode: Mode
  /** Tonique : lettre (0 = Do ... 6 = Si) et altération. */
  letter: number
  alter: Alter
  /** Armure : nombre de dièses (positif) ou de bémols (négatif). */
  fifths: number
  /** Libellé du bouton, ex. « Fa♯ M », « La m ». */
  label: string
  /** Armure pour VexFlow (tonalité majeure qui a la même armure), ex. « F# », « Bb ». */
  vex: string
}

const SIGNS: Record<number, string> = { [-1]: '♭', 0: '', 1: '♯' }
const ID_SIGNS: Record<number, string> = { [-1]: 'b', 0: '', 1: '#' }
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]
const VEX_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

/** Toniques majeures, de 7 bémols à 7 dièses : [lettre, altération]. */
const MAJOR_TONICS: [number, Alter][] = [
  [0, -1], [4, -1], [1, -1], [5, -1], [2, -1], [6, -1], [3, 0], // Do♭ Sol♭ Ré♭ La♭ Mi♭ Si♭ Fa
  [0, 0], // Do
  [4, 0], [1, 0], [5, 0], [2, 0], [6, 0], [3, 1], [0, 1], // Sol Ré La Mi Si Fa♯ Do♯
]

const mod = (n: number, m: number) => ((n % m) + m) % m
const pcOf = (letter: number, alter: number) => mod(LETTER_PC[letter] + alter, 12)

function makeKey(letter: number, alter: Alter, mode: Mode, fifths: number, vex: string): Key {
  return {
    id: `${LETTERS[letter].toLowerCase()}${ID_SIGNS[alter]}-${mode}`,
    mode,
    letter,
    alter,
    fifths,
    label: `${LETTERS[letter]}${SIGNS[alter]} ${mode}`,
    vex,
  }
}

/** Les 15 tonalités majeures et leurs 15 relatives mineures (une tierce mineure plus bas). */
export const KEYS: Key[] = MAJOR_TONICS.flatMap(([letter, alter], i) => {
  const fifths = i - 7
  const vex = `${VEX_LETTERS[letter]}${alter === 1 ? '#' : alter === -1 ? 'b' : ''}`
  const minorLetter = mod(letter - 2, 7)
  // La relative mineure sonne 3 demi-tons plus bas ; son altération découle de sa lettre.
  let minorAlter = mod(pcOf(letter, alter) - 3 - LETTER_PC[minorLetter], 12)
  if (minorAlter > 6) minorAlter -= 12
  return [makeKey(letter, alter, 'M', fifths, vex), makeKey(minorLetter, minorAlter as Alter, 'm', fifths, vex)]
})

export const keyById = (id: string) => KEYS.find((k) => k.id === id)

/** La relative : même armure, autre mode. */
export const relativeOf = (k: Key) => KEYS.find((o) => o.fifths === k.fifths && o.mode !== k.mode)!

/** Classe de la tonique : 0 = Do ... 11 = Si. */
export const tonicPc = (k: Key) => pcOf(k.letter, k.alter)

/** Gamme montante sur une octave (mineure naturelle pour le mode mineur), en numéros MIDI, autour du Do3. */
export function scaleOf(k: Key): number[] {
  const steps = k.mode === 'M' ? [0, 2, 4, 5, 7, 9, 11, 12] : [0, 2, 3, 5, 7, 8, 10, 12]
  let tonic = 60 + tonicPc(k)
  if (tonic > 66) tonic -= 12
  return steps.map((s) => tonic + s)
}

export type Level = 'debutant' | 'normal' | 'expert' | 'impossible'

export interface LevelConfig {
  label: string
  description: string
  clefs: ClefId[]
  modes: Mode[]
  /** Impossible : la portée s'efface au bout de ce délai (ms), et revient avec la réponse. */
  flashMs?: number
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: { label: 'Débutant', description: 'Clé de sol, tonalités majeures.', clefs: ['sol'], modes: ['M'] },
  normal: { label: 'Normal', description: 'Clés de sol et de fa, tonalités majeures.', clefs: ['sol', 'fa'], modes: ['M'] },
  expert: {
    label: 'Expert',
    description: 'Toutes les clés, tonalités majeures et mineures.',
    clefs: ['sol', 'fa', 'ut1', 'ut3', 'ut4'],
    modes: ['M', 'm'],
  },
  impossible: {
    label: 'Impossible',
    description: 'Toutes les clés, tonalités majeures et mineures, et l’armure s’efface au bout de 2 secondes.',
    clefs: ['sol', 'fa', 'ut1', 'ut3', 'ut4'],
    modes: ['M', 'm'],
    flashMs: 2000,
  },
}

export const QUESTION_COUNTS = [10, 20, 30, 50] as const

export interface KeySignatureSettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: KeySignatureSettings = { questions: 20, level: 'debutant' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): KeySignatureSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level) as Level
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? level : DEFAULT_SETTINGS.level,
  }
}

/**
 * Tonalités proposées, toutes du mode demandé et sans doublon enharmonique (Do♭ M = Si M, Fa♯ M = Sol♭ M,
 * Do♯ M = Ré♭ M, et leurs relatives) :
 * - armure en bémols : les tonalités en bémols, plus celle sans altération (8 propositions) ;
 * - armure en dièses : les tonalités en dièses, plus celle sans altération (8 propositions) ;
 * - sans altération : une tonalité par note (12 propositions), sous son nom le plus courant.
 */
export function choicesFor(key: Key): Key[] {
  const sameMode = KEYS.filter((k) => k.mode === key.mode)
  if (key.fifths < 0) return sameMode.filter((k) => k.fifths <= 0)
  if (key.fifths > 0) return sameMode.filter((k) => k.fifths >= 0)
  // Sans altération : on écarte les armures à 7 altérations (Do♭/Do♯ M, La♭/La♯ m) et l'un des deux noms à 6 :
  // Fa♯ M plutôt que Sol♭ M, Mi♭ m plutôt que Ré♯ m.
  const sixth = key.mode === 'M' ? -6 : 6
  return sameMode.filter((k) => Math.abs(k.fifths) <= 6 && k.fifths !== sixth)
}

/** La question, selon le mode demandé. */
export const PROMPTS: Record<Mode, string> = { M: 'Quelle est la tonalité Majeure ?', m: 'Quelle est la tonalité mineure ?' }

/** Ordre d'affichage : par hauteur de la tonique (Do, Do♯, Ré♭, Ré…), puis par nom de note, majeur avant mineur. */
function byTonic(a: Key, b: Key): number {
  return tonicPc(a) - tonicPc(b) || a.letter - b.letter || (a.mode === b.mode ? 0 : a.mode === 'M' ? -1 : 1)
}

export interface Question {
  clef: ClefId
  key: Key
  /** « Quelle est la tonalité Majeure ? » ou « Quelle est la tonalité mineure ? » */
  prompt: string
  /** Les tonalités du mode demandé, du côté de l'armure (bémols ou dièses), sans doublon. */
  choices: Key[]
  picked?: string
}

export function createQuestion(level: Level): Question {
  const cfg = LEVELS[level]
  const clef = cfg.clefs[randomInt(0, cfg.clefs.length - 1)]
  const mode = cfg.modes[randomInt(0, cfg.modes.length - 1)]
  const pool = KEYS.filter((k) => k.mode === mode)
  const key = pool[randomInt(0, pool.length - 1)]
  // Une tonalité par armure dans un mode : la bonne réponse est la seule à avoir l'armure montrée.
  return { clef, key, prompt: PROMPTS[mode], choices: choicesFor(key).sort(byTonic) }
}
