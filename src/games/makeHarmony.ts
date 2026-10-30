import { randomInt } from '@/music/notes'
import { LETTERS, spellWithLetter, type SpelledNote } from '@/music/spelling'
import { INTERVALS, type Interval } from './intervals'
import { CHOICES, CLEFS, noteAt, randomAlter, stepRange, type ClefId } from './readNote'

/**
 * « Fais l'harmonie » : une note de départ est écrite sur une portée, avec sa clé ; on cherche la note qui
 * forme l'intervalle demandé (« Quelle note est la quinte juste ascendante du Do ? »), parmi les 12 notes
 * de la gamme, sans l'octave. Pas de son à deviner, pas de diapason.
 */

export { CHOICES, CLEFS }

export type Level = 'debutant' | 'normal' | 'expert' | 'impossible'

export interface LevelConfig {
  label: string
  description: string
  /** Intervalles possibles (en demi-tons). L'octave est écartée : sa réponse serait la note de départ. */
  semitones: number[]
  /** La note de départ peut être altérée (♯ ou ♭). */
  alterations: boolean
  /** Intervalles descendants aussi. */
  directions: boolean
  clefs: ClefId[]
  /** Impossible : la portée s'efface au bout de ce délai (ms), et revient avec la réponse. */
  flashMs?: number
}

const ALL = INTERVALS.filter((i) => i.number < 8).map((i) => i.semitones)

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: {
    label: 'Débutant',
    description: 'Tierce majeure, quarte juste et quinte juste, en montant, à partir d’une note sans altération. Clé de sol.',
    semitones: [4, 5, 7],
    alterations: false,
    directions: false,
    clefs: ['sol'],
  },
  normal: {
    label: 'Normal',
    description: 'Tous les intervalles, de la seconde mineure à la septième majeure, en montant ; la note de départ peut être altérée. Clés de sol et de fa.',
    semitones: ALL,
    alterations: true,
    directions: false,
    clefs: ['sol', 'fa'],
  },
  expert: {
    label: 'Expert',
    description: 'Tous les intervalles, en montant ou en descendant, à partir de n’importe quelle note. Toutes les clés.',
    semitones: ALL,
    alterations: true,
    directions: true,
    clefs: ['sol', 'fa', 'ut1', 'ut3', 'ut4'],
  },
  impossible: {
    label: 'Impossible',
    description: 'Tous les intervalles, dans les deux sens, toutes les clés, et la note s’efface au bout de 2 secondes.',
    semitones: ALL,
    alterations: true,
    directions: true,
    clefs: ['sol', 'fa', 'ut1', 'ut3', 'ut4'],
    flashMs: 2000,
  },
}

export const QUESTION_COUNTS = [10, 20, 30, 50] as const

export interface MakeHarmonySettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: MakeHarmonySettings = { questions: 20, level: 'debutant' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): MakeHarmonySettings {
  const questions = Number(raw.questions)
  const level = String(raw.level) as Level
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? level : DEFAULT_SETTINGS.level,
  }
}

const NUMBER_NAMES: Record<number, string> = { 2: 'seconde', 3: 'tierce', 4: 'quarte', 5: 'quinte', 6: 'sixte', 7: 'septième' }

/** Nom d'un intervalle dans une phrase, ex. « quinte juste », « septième majeure ». */
export function intervalLabel(i: Interval): string {
  return `${NUMBER_NAMES[i.number]} ${i.quality}`
}

const ALTER_NAMES: Record<number, string> = { [-2]: ' double bémol', [-1]: '♭', 0: '', 1: '♯', 2: ' double dièse' }

/** Nom d'une note sans octave, en toutes lettres pour les doubles altérations : « Ré♯ », « Do double dièse ». */
export function pitchLabel(n: SpelledNote): string {
  return `${LETTERS[n.letter]}${ALTER_NAMES[n.alter]}`
}

export interface Question {
  clef: ClefId
  /** Note de départ, écrite sur la portée. */
  base: SpelledNote
  interval: Interval
  ascending: boolean
  /** Note cherchée, correctement écrite (lettre imposée par l'intervalle, double altération possible). */
  target: SpelledNote
  /** Classe de la bonne réponse : 0 = Do ... 11 = Si. */
  answer: number
  /** « Quelle note est la quinte juste ascendante du Do ? » */
  prompt: string
  picked?: number
}

const mod = (n: number, m: number) => ((n % m) + m) % m

export function createQuestion(level: Level): Question {
  const cfg = LEVELS[level]
  const intervals = INTERVALS.filter((i) => cfg.semitones.includes(i.semitones))
  for (;;) {
    const clef = cfg.clefs[randomInt(0, cfg.clefs.length - 1)]
    const interval = intervals[randomInt(0, intervals.length - 1)]
    const ascending = cfg.directions ? Math.random() < 0.5 : true
    // La note de départ et la réponse restent sur la portée, à deux lignes supplémentaires au plus.
    const span = interval.number - 1
    const { low, high } = stepRange(clef, 2)
    const step = ascending ? randomInt(low, high - span) : randomInt(low + span, high)
    const letter = mod(step, 7)
    const base = noteAt(step, cfg.alterations ? randomAlter(letter) : 0)
    const midi = base.midi + (ascending ? interval.semitones : -interval.semitones)
    const target = spellWithLetter(midi, mod(letter + (ascending ? span : -span), 7), 2)
    if (!target) continue // Impossible avec ces intervalles et ces notes de départ, mais on reste prudent.
    return {
      clef,
      base,
      interval,
      ascending,
      target,
      answer: mod(midi, 12),
      prompt: `Quelle note est la ${intervalLabel(interval)} ${ascending ? 'ascendante' : 'descendante'} du ${pitchLabel(base)} ?`,
    }
  }
}
