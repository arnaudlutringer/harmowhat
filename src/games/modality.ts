import { randomInt } from '@/music/notes'
import { spellWithLetter, type Alter, type SpelledNote } from '@/music/spelling'

/**
 * « La modalité » : une gamme est jouée dans l'un des sept modes (ionien, dorien, phrygien, lydien,
 * mixolydien, éolien, locrien), à partir d'une note de départ au hasard ; on reconnaît le mode à l'oreille.
 * Pas d'armure : les dièses et les bémols sont écrits sur les notes.
 */

export type ModeId = 'ionien' | 'dorien' | 'phrygien' | 'lydien' | 'mixolydien' | 'eolien' | 'locrien'

export interface ModeInfo {
  id: ModeId
  label: string
  /** Degré de la gamme majeure sur lequel commence le mode, en chiffres romains (I pour l'ionien… VII pour le locrien). */
  degree: string
  /** Note de départ du mode sur les touches blanches (Do pour l'ionien… Si pour le locrien). */
  white: string
  /** Écarts entre les notes successives, en demi-tons (1 = demi-ton, 2 = ton). */
  steps: number[]
}

/** La gamme majeure, dont chaque mode est une rotation. */
const MAJOR_STEPS = [2, 2, 1, 2, 2, 2, 1]
const rotate = (k: number) => [...MAJOR_STEPS.slice(k), ...MAJOR_STEPS.slice(0, k)]

export const MODES: ModeInfo[] = [
  { id: 'ionien', label: 'Ionien', degree: 'I', white: 'Do', steps: rotate(0) },
  { id: 'dorien', label: 'Dorien', degree: 'II', white: 'Ré', steps: rotate(1) },
  { id: 'phrygien', label: 'Phrygien', degree: 'III', white: 'Mi', steps: rotate(2) },
  { id: 'lydien', label: 'Lydien', degree: 'IV', white: 'Fa', steps: rotate(3) },
  { id: 'mixolydien', label: 'Mixolydien', degree: 'V', white: 'Sol', steps: rotate(4) },
  { id: 'eolien', label: 'Éolien', degree: 'VI', white: 'La', steps: rotate(5) },
  { id: 'locrien', label: 'Locrien', degree: 'VII', white: 'Si', steps: rotate(6) },
]

export const modeById = (id: string) => MODES.find((m) => m.id === id)

export type Level = 'debutant' | 'normal' | 'expert' | 'impossible'

export interface LevelConfig {
  label: string
  description: string
  /** La portée est montrée pendant la question (sinon seulement après la réponse). */
  showStaff: boolean
  /** Les tons (1) et demi-tons (½) entre les notes sont écrits pendant la question. */
  showSteps: boolean
  /** Impossible : la gamme est jouée en descendant une fois sur deux, par un instrument différent à chaque question. */
  twisted?: boolean
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: {
    label: 'Débutant',
    description: 'La gamme est écrite sur la portée, avec les tons (1) et les demi-tons (½) entre les notes.',
    showStaff: true,
    showSteps: true,
  },
  normal: {
    label: 'Normal',
    description: 'La gamme est écrite sur la portée, sans les intervalles.',
    showStaff: true,
    showSteps: false,
  },
  expert: {
    label: 'Expert',
    description: 'À l’oreille seulement : la portée n’apparaît qu’avec la réponse.',
    showStaff: false,
    showSteps: false,
  },
  impossible: {
    label: 'Impossible',
    description: 'À l’oreille seulement, la gamme jouée en descendant une fois sur deux, par un instrument différent à chaque question.',
    showStaff: false,
    showSteps: false,
    twisted: true,
  },
}

export const QUESTION_COUNTS = [10, 20, 30, 50] as const

export interface ModalitySettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: ModalitySettings = { questions: 20, level: 'debutant' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): ModalitySettings {
  const questions = Number(raw.questions)
  const level = String(raw.level) as Level
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? level : DEFAULT_SETTINGS.level,
  }
}

const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]

/**
 * Les 8 notes de la gamme d'un mode, de la note de départ à son octave, écrites avec une lettre par degré.
 * Renvoie null s'il faudrait un double dièse ou un double bémol.
 */
export function scaleNotes(mode: ModeInfo, tonic: SpelledNote): SpelledNote[] | null {
  const notes: SpelledNote[] = [tonic]
  let midi = tonic.midi
  for (let i = 0; i < 7; i++) {
    midi += mode.steps[i]
    const note = spellWithLetter(midi, (tonic.letter + i + 1) % 7)
    if (!note) return null
    notes.push(note)
  }
  return notes
}

export interface Question {
  mode: ModeInfo
  /** La gamme jouée et écrite : 8 notes, montantes. */
  notes: SpelledNote[]
  picked?: ModeId
}

/** Notes de départ : de Sol2 à Fa♯3 (notation française), pour que la gamme reste lisible en clé de sol. */
export const TONIC_LOW = 55
export const TONIC_HIGH = 66

export function createQuestion(): Question {
  for (;;) {
    const mode = MODES[randomInt(0, MODES.length - 1)]
    const letter = randomInt(0, 6)
    // Note de départ naturelle le plus souvent, parfois altérée (jamais Mi♯, Si♯, Fa♭ ni Do♭).
    const options: Alter[] = [0, 0]
    if (letter !== 2 && letter !== 6) options.push(1)
    if (letter !== 0 && letter !== 3) options.push(-1)
    const alter = options[randomInt(0, options.length - 1)]
    const pc = (LETTER_PC[letter] + alter + 12) % 12
    let midi = 48 + pc
    while (midi < TONIC_LOW) midi += 12
    if (midi > TONIC_HIGH) continue
    const notes = scaleNotes(mode, { midi, letter, alter })
    if (notes) return { mode, notes }
  }
}
