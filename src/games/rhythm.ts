import { randomInt, shuffle } from '@/music/notes'

/**
 * Jeux de rythme (« Quel rythme ? », « Joue le rythme ») : une mesure de 3 temps, chaque temps rempli
 * par une cellule rythmique (noire, deux croches, soupir…). Partagé par les deux jeux : les cellules,
 * les niveaux, le tirage des questions, la séquence à jouer et le jugement des frappes.
 */

export type CellId =
  | 'noire' | 'croches' | 'soupir' | 'doubles' | 'croche-doubles' | 'doubles-croche' | 'demi-soupir-croche' | 'pointee' | 'triolet'

export interface Cell {
  id: CellId
  label: string
  /** Durées des notes, en fraction de temps (une durée négative est un silence). */
  parts: number[]
  /** Figures VexFlow (q, 8, 16, 8d ; suffixe r pour un silence). */
  vex: string[]
  /** Triolet : trois croches dans un temps. */
  tuplet?: boolean
}

export const CELLS: Record<CellId, Cell> = {
  noire: { id: 'noire', label: 'Noire', parts: [1], vex: ['q'] },
  croches: { id: 'croches', label: 'Deux croches', parts: [0.5, 0.5], vex: ['8', '8'] },
  soupir: { id: 'soupir', label: 'Soupir', parts: [-1], vex: ['qr'] },
  doubles: { id: 'doubles', label: 'Quatre doubles croches', parts: [0.25, 0.25, 0.25, 0.25], vex: ['16', '16', '16', '16'] },
  'croche-doubles': { id: 'croche-doubles', label: 'Croche et deux doubles', parts: [0.5, 0.25, 0.25], vex: ['8', '16', '16'] },
  'doubles-croche': { id: 'doubles-croche', label: 'Deux doubles et croche', parts: [0.25, 0.25, 0.5], vex: ['16', '16', '8'] },
  'demi-soupir-croche': { id: 'demi-soupir-croche', label: 'Demi-soupir et croche', parts: [-0.5, 0.5], vex: ['8r', '8'] },
  pointee: { id: 'pointee', label: 'Croche pointée et double', parts: [0.75, 0.25], vex: ['8d', '16'] },
  triolet: { id: 'triolet', label: 'Triolet de croches', parts: [1 / 3, 1 / 3, 1 / 3], vex: ['8', '8', '8'], tuplet: true },
}

export type Level = 'debutant' | 'normal' | 'expert'

export interface LevelConfig {
  label: string
  description: string
  cells: CellId[]
  /** Tempo, en noires par minute. */
  tempo: number
  /** « Joue le rythme » : écart toléré entre une frappe et la note, en secondes. */
  tolerance: number
}

export const LEVELS: Record<Level, LevelConfig> = {
  debutant: {
    label: 'Débutant',
    description: 'Noires, croches et soupirs, à un tempo tranquille.',
    cells: ['noire', 'croches', 'soupir'],
    tempo: 76,
    tolerance: 0.15,
  },
  normal: {
    label: 'Normal',
    description: 'Avec les doubles croches et le demi-soupir.',
    cells: ['noire', 'croches', 'soupir', 'doubles', 'croche-doubles', 'doubles-croche', 'demi-soupir-croche'],
    tempo: 84,
    tolerance: 0.1,
  },
  expert: {
    label: 'Expert',
    description: 'Avec la croche pointée et le triolet, un peu plus vite.',
    cells: ['noire', 'croches', 'soupir', 'doubles', 'croche-doubles', 'doubles-croche', 'demi-soupir-croche', 'pointee', 'triolet'],
    tempo: 96,
    tolerance: 0.07,
  },
}

/** Nombre de temps de la mesure (et de cellules à trouver). */
export const BEATS = 3

export const QUESTION_COUNTS = [5, 10, 20] as const

export interface RhythmSettings {
  questions: number
  level: Level
}

export const DEFAULT_SETTINGS: RhythmSettings = { questions: 10, level: 'normal' }

/** Lit des réglages depuis une source non fiable (URL, stockage), avec repli sur les valeurs par défaut. */
export function parseSettings(raw: { questions?: unknown; level?: unknown }): RhythmSettings {
  const questions = Number(raw.questions)
  const level = String(raw.level)
  return {
    questions: (QUESTION_COUNTS as readonly number[]).includes(questions) ? questions : DEFAULT_SETTINGS.questions,
    level: level in LEVELS ? (level as Level) : DEFAULT_SETTINGS.level,
  }
}

export interface RhythmQuestion {
  cells: CellId[]
  /** « Quel rythme ? » : cellules proposées (celles du niveau, dans l'ordre de difficulté). */
  choices: CellId[]
}

/** Trois cellules au hasard ; la première n'est jamais un silence (le rythme part sur le premier temps). */
export function createRhythmQuestion(level: Level): RhythmQuestion {
  const pool = LEVELS[level].cells
  const sounding = pool.filter((c) => CELLS[c].parts[0] > 0)
  const cells: CellId[] = [sounding[randomInt(0, sounding.length - 1)]]
  while (cells.length < BEATS) cells.push(pool[randomInt(0, pool.length - 1)])
  return { cells, choices: [...pool] }
}

/** Instants où une note commence, en temps depuis le début de la mesure. */
export function onsets(cells: readonly CellId[]): number[] {
  const out: number[] = []
  cells.forEach((id, beat) => {
    let t = beat
    for (const d of CELLS[id].parts) {
      if (d > 0) out.push(t)
      t += Math.abs(d)
    }
  })
  return out
}

/** Notes à jouer (en temps) : la note de chaque attaque, sa durée un peu raccourcie pour bien détacher les notes. */
export function rhythmNotes(cells: readonly CellId[]): { at: number; len: number }[] {
  const out: { at: number; len: number }[] = []
  cells.forEach((id, beat) => {
    let t = beat
    for (const d of CELLS[id].parts) {
      if (d > 0) out.push({ at: t, len: d * 0.85 })
      t += Math.abs(d)
    }
  })
  return out
}

export interface TapMatch {
  /** Instant attendu, en secondes depuis le début de la mesure. */
  expected: number
  /** Frappe retenue (en secondes), ou null si aucune assez proche. */
  tap: number | null
  /** Écart frappe − note, en secondes (positif : en retard). */
  error: number | null
  onTime: boolean
}

export interface TapVerdict {
  matches: TapMatch[]
  /** Frappes en trop. */
  extra: number[]
  correct: boolean
  /** Écart moyen, en secondes, sur les notes trouvées. */
  meanError: number
}

/**
 * Compare les frappes du joueur aux notes attendues : chaque note prend la frappe la plus proche
 * (une frappe ne sert qu'une fois, dans une fenêtre de deux fois la tolérance) ; c'est juste si toutes
 * les notes ont leur frappe dans la tolérance et qu'il n'y a pas de frappe en trop.
 */
export function judgeTaps(expected: readonly number[], taps: readonly number[], tolerance: number): TapVerdict {
  const free = [...taps].sort((a, b) => a - b)
  const matches: TapMatch[] = expected.map((e) => {
    let best = -1
    for (let i = 0; i < free.length; i++) if (best < 0 || Math.abs(free[i] - e) < Math.abs(free[best] - e)) best = i
    if (best < 0 || Math.abs(free[best] - e) > tolerance * 2) return { expected: e, tap: null, error: null, onTime: false }
    const tap = free.splice(best, 1)[0]
    return { expected: e, tap, error: tap - e, onTime: Math.abs(tap - e) <= tolerance }
  })
  const found = matches.filter((m) => m.error !== null)
  const meanError = found.length ? found.reduce((s, m) => s + Math.abs(m.error!), 0) / found.length : 0
  return { matches, extra: free, correct: matches.every((m) => m.onTime) && free.length === 0, meanError }
}

/** Écart en dessous duquel une frappe compte comme parfaite (la précision d'un doigt sur un écran). */
const PERFECT = 0.02

/** Points d'un rythme joué juste : 10 000 si chaque frappe est parfaite, jusqu'à 100 à la limite de la tolérance. */
export function tapPoints(verdict: TapVerdict, tolerance: number): number {
  if (!verdict.correct) return 0
  const over = Math.max(0, verdict.meanError - PERFECT) / Math.max(0.001, tolerance - PERFECT)
  return Math.max(100, Math.round(10000 - Math.min(1, over) * 9900))
}

/** Cellules proposées dans « Quel rythme ? », mélangées pour ne pas trahir la réponse. */
export function shuffledChoices(q: RhythmQuestion): CellId[] {
  return shuffle([...q.choices])
}
