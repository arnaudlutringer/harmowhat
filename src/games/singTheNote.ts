import { randomInt } from '@/music/notes'
import { isBlackKey, randomSpelling, spell, spelledPitchName } from '@/music/spelling'
import { centsFromPitchClass, midiOf, type Pitch } from '@/audio/pitch'

/**
 * « Chante la note » : le diapason (La3) sonne, puis le joueur chante dans le micro la note demandée.
 * La note chantée est jugée à l'octave près (chacun chante dans sa voix) ; le niveau fixe la justesse
 * demandée, en cents (centièmes de demi-ton).
 */

export type Level = 'debutant' | 'normal' | 'expert'

export interface LevelConfig {
  label: string
  description: string
  /** Uniquement les notes naturelles (Do Ré Mi Fa Sol La Si). */
  naturalsOnly: boolean
  /** Écart toléré avec la note demandée, en cents, de part et d'autre. */
  tolerance: number
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: {
    label: 'Débutant',
    description: 'Notes naturelles seulement : il suffit de chanter la bonne note (à un quart de ton près).',
    naturalsOnly: true,
    tolerance: 50,
  },
  normal: {
    label: 'Normal',
    description: 'Les 12 notes, à 30 cents près (un petit tiers de demi-ton).',
    naturalsOnly: false,
    tolerance: 30,
  },
  expert: {
    label: 'Expert',
    description: 'Les 12 notes, à 15 cents près : il faut chanter juste.',
    naturalsOnly: false,
    tolerance: 15,
  },
}

export const QUESTION_COUNTS = [5, 10, 20] as const

export interface SingTheNoteSettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: SingTheNoteSettings = { questions: 10, level: 'normal' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): SingTheNoteSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level)
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? (level as Level) : DEFAULT_SETTINGS.level,
  }
}

export interface Question {
  /** Classe de la note demandée : 0 = Do … 11 = Si. */
  pitchClass: number
  /** Nom affiché (ex. "Si♭"). */
  name: string
}

export function createQuestion(level: Level, previous?: Question): Question {
  let pitchClass: number
  do {
    pitchClass = randomInt(0, 11)
  } while ((LEVELS[level].naturalsOnly && isBlackKey(pitchClass)) || pitchClass === previous?.pitchClass)
  return { pitchClass, name: spelledPitchName(spell(pitchClass, randomSpelling())) }
}

export interface Verdict {
  /** Note chantée, arrondie au demi-ton (numéro MIDI). */
  sung: number
  /** Écart avec la note demandée, en cents, à l'octave près (positif : trop haut). */
  cents: number
  correct: boolean
}

export function judge(frequency: number, question: Question, level: Level): Verdict {
  const midi = midiOf(frequency)
  const cents = centsFromPitchClass(midi, question.pitchClass)
  return { sung: Math.round(midi), cents, correct: Math.abs(cents) <= LEVELS[level].tolerance }
}

/** Nombre de mesures successives (une toutes les ~50 ms) qui doivent s'accorder : environ 0,4 s de note tenue. */
export const STABLE_READINGS = 8
/** Deux mesures d'une même note tenue ne s'écartent pas de plus d'un tiers de demi-ton. */
const STABLE_SPREAD_CENTS = 35
const MIN_CLARITY = 0.85

/**
 * Attend une note tenue : les mesures du micro arrivent une à une, et dès que les dernières
 * s'accordent, renvoie leur fréquence médiane. Un silence ou un son confus fait recommencer.
 */
export class HeldNote {
  private readings: number[] = []

  push(pitch: Pitch | null): number | null {
    if (!pitch || pitch.clarity < MIN_CLARITY) {
      this.readings = []
      return null
    }
    const midi = midiOf(pitch.frequency)
    // Une mesure qui s'éloigne trop des précédentes : la note a changé, on repart d'elle.
    if (this.readings.some((r) => Math.abs(r - midi) * 100 > STABLE_SPREAD_CENTS)) this.readings = []
    this.readings.push(midi)
    if (this.readings.length < STABLE_READINGS) return null
    const sorted = [...this.readings].sort((a, b) => a - b)
    this.readings = []
    return 440 * Math.pow(2, (sorted[sorted.length >> 1] - 69) / 12)
  }

  /** Avancement vers une note tenue, de 0 à 1 (pour l'affichage). */
  get progress(): number {
    return this.readings.length / STABLE_READINGS
  }

  reset(): void {
    this.readings = []
  }
}
