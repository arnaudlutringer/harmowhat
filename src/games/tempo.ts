import { randomInt, shuffle } from '@/music/notes'
import { createRhythmQuestion, melodyPitches, onsets, type CellId } from './rhythm'
import { STANDARD_QUESTION_COUNTS } from './questionCounts'

/**
 * Jeux de tempo :
 * - « Garde le tempo » : après 3 temps de métronome, le joueur tape chaque temps, sans métronome, le plus longtemps
 *   possible. Toutes les 30 secondes tenues, le tempo change ; la partie s'arrête au premier écart trop grand.
 * - « Trouve le tempo » : 3 temps de métronome puis une mélodie de 3 temps ; le joueur retrouve le tempo
 *   (parmi 4 propositions en débutant, sur un curseur de métronome ensuite).
 */

export type Level = 'debutant' | 'normal' | 'expert'

/** Durée d'un palier de « Garde le tempo », en secondes : tenu jusqu'au bout, le tempo change. */
export const STAGE_SECONDS = 30

export interface KeepLevel {
  label: string
  description: string
  /** Écart toléré entre une frappe et le temps, en secondes (comme « Joue le rythme »). */
  tolerance: number
  /** Tempo du premier palier (débutant) ; les suivants montent de `step`. */
  start?: number
  step?: number
  /** Tempo au hasard à chaque palier, entre ces deux valeurs. */
  range?: [number, number]
}

export const KEEP_LEVELS: Record<Level, KeepLevel> = {
  debutant: {
    label: 'Débutant',
    description: 'On commence à 60 à la noire, puis 70, 80… à chaque palier de 30 secondes tenu.',
    tolerance: 0.15,
    start: 60,
    step: 10,
  },
  normal: {
    label: 'Normal',
    description: 'Un tempo au hasard entre 50 et 120 à chaque palier de 30 secondes.',
    tolerance: 0.1,
    range: [50, 120],
  },
  expert: {
    label: 'Expert',
    description: 'Un tempo au hasard entre 40 et 160 à chaque palier, avec une tolérance plus fine.',
    tolerance: 0.07,
    range: [40, 160],
  },
}

/** « Garde le tempo » n'a pas de nombre de questions : la partie dure tant que le joueur tient. */
export const KEEP_QUESTION_COUNTS = [1] as const

/** Tempo du palier `index` (0 pour le premier). */
export function stageTempo(level: Level, index: number): number {
  const cfg = KEEP_LEVELS[level]
  if (cfg.range) return randomInt(cfg.range[0], cfg.range[1])
  return (cfg.start ?? 60) + index * (cfg.step ?? 10)
}

/** Nombre de temps à taper dans un palier de 30 secondes. */
export const stageBeats = (tempo: number) => Math.round((STAGE_SECONDS * tempo) / 60)

/** Points d'un palier de 30 secondes tenu jusqu'au bout ; chaque temps en rapporte sa part (10 000 / nombre de temps). */
export const STAGE_POINTS = 10000

/**
 * Juge une frappe (en secondes depuis le premier temps) : le temps le plus proche, l'écart, et si elle est
 * acceptée (dans la tolérance, et sur un temps pas encore frappé).
 */
export function judgeBeat(tap: number, beat: number, tolerance: number, done: ReadonlySet<number>) {
  const index = Math.max(0, Math.round(tap / beat))
  const error = tap - index * beat
  return { index, error, ok: Math.abs(error) <= tolerance && !done.has(index) }
}

export interface FindLevel {
  label: string
  description: string
  /** Débutant : 4 tempos proposés, multiples de 10 entre `low` et `high`. */
  choices?: number
  low: number
  high: number
  /** Curseur : écart accepté avec le bon tempo. */
  tolerance: number
}

export const FIND_LEVELS: Record<Level, FindLevel> = {
  debutant: {
    label: 'Débutant',
    description: 'Un tempo rond (50, 60… jusqu’à 140) à retrouver parmi 4 propositions bien différentes.',
    choices: 4,
    low: 50,
    high: 140,
    tolerance: 0,
  },
  normal: {
    label: 'Normal',
    description: 'Règle le métronome entre 40 et 200 : il faut tomber à 10 près.',
    low: 40,
    high: 200,
    tolerance: 10,
  },
  expert: {
    label: 'Expert',
    description: 'Règle le métronome entre 40 et 200 : il faut tomber à 4 près.',
    low: 40,
    high: 200,
    tolerance: 4,
  },
}

export const FIND_QUESTION_COUNTS = STANDARD_QUESTION_COUNTS

export interface FindQuestion {
  tempo: number
  /** La mélodie de 3 temps (cellules rythmiques et hauteurs). */
  cells: CellId[]
  pitches: number[]
  /** Débutant : tempos proposés, du plus lent au plus rapide. */
  choices: number[]
}

/** Écart minimal entre deux tempos proposés en débutant, pour qu'ils soient bien différents. */
export const CHOICE_GAP = 20

export function createFindQuestion(level: Level): FindQuestion {
  const cfg = FIND_LEVELS[level]
  const tempo = cfg.choices ? randomInt(cfg.low / 10, cfg.high / 10) * 10 : randomInt(cfg.low, cfg.high)
  // Une mélodie variée (rythmes du niveau normal, plusieurs hauteurs) ; son tempo est celui à trouver.
  const { cells } = createRhythmQuestion('normal')
  const choices: number[] = [tempo]
  if (cfg.choices) {
    const pool = shuffle(Array.from({ length: (cfg.high - cfg.low) / 10 + 1 }, (_, i) => cfg.low + i * 10))
    for (const t of pool) {
      if (choices.length >= cfg.choices) break
      if (choices.every((c) => Math.abs(c - t) >= CHOICE_GAP)) choices.push(t)
    }
  }
  return { tempo, cells, pitches: melodyPitches(onsets(cells).length), choices: choices.sort((a, b) => a - b) }
}

/** Réponse au curseur : juste si l'écart avec le tempo ne dépasse pas la tolérance du niveau. */
export const isTempoClose = (level: Level, answer: number, tempo: number) => Math.abs(answer - tempo) <= FIND_LEVELS[level].tolerance

/** Nom italien d'un tempo, comme sur un métronome. */
export function tempoName(bpm: number): string {
  if (bpm < 60) return 'Largo'
  if (bpm < 76) return 'Adagio'
  if (bpm < 108) return 'Andante'
  if (bpm < 120) return 'Moderato'
  if (bpm < 168) return 'Allegro'
  return 'Presto'
}

export interface TempoSettings {
  questions: number
  level: Level
}

function parse(raw: { questions?: unknown; level?: unknown }, counts: readonly number[], fallback: number): TempoSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level)
  return {
    questions: counts.includes(questions) ? questions : fallback,
    level: level in KEEP_LEVELS ? (level as Level) : 'debutant',
  }
}

export const parseKeepSettings = (raw: { questions?: unknown; level?: unknown }) => parse(raw, KEEP_QUESTION_COUNTS, 1)
export const parseFindSettings = (raw: { questions?: unknown; level?: unknown }) => parse(raw, FIND_QUESTION_COUNTS, 10)
