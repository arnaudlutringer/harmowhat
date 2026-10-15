import { afterSettings } from './ready'
import { LEVELS as NOTE_LEVELS, QUESTION_COUNTS as NOTE_COUNTS } from './nameTheNote'
import { LEVELS as INTERVAL_LEVELS, PRECISIONS, QUESTION_COUNTS as INTERVAL_COUNTS } from './intervals'
import { LEVELS as READ_LEVELS, QUESTION_COUNTS as READ_COUNTS } from './readNote'

/**
 * Meilleurs scores : un classement par jeu, par niveau et par nombre de questions,
 * mémorisé sur l'appareil. Seuls les 10 meilleurs sont gardés.
 */

export type GameId = 'grave-ou-aigu' | 'quelle-note' | 'accords' | 'harmonies' | 'lecture-note'

/** Un classement : le jeu, le niveau (identifiant) et le nombre de questions. */
export interface Board {
  game: GameId
  level: string
  questions: number
}

export interface ScoreEntry {
  name: string
  points: number
  correct: number
  /** Date de la partie (ISO). */
  date: string
}

export const MAX_ENTRIES = 10
export const MAX_NAME_LENGTH = 10
/** Niveau des jeux qui n'en ont qu'un. */
export const SINGLE_LEVEL = 'unique'

interface GameInfo {
  title: string
  /** Niveaux proposés (identifiant et libellé), dans l'ordre d'affichage. */
  levels: { id: string; label: string }[]
  questionCounts: readonly number[]
}

export const GAMES: Record<GameId, GameInfo> = {
  'grave-ou-aigu': { title: 'Grave ou aigu ?', levels: [{ id: SINGLE_LEVEL, label: 'Niveau unique' }], questionCounts: [20] },
  'quelle-note': {
    title: 'Quelle est la note ?',
    levels: Object.entries(NOTE_LEVELS).map(([id, cfg]) => ({ id, label: cfg.label })),
    questionCounts: NOTE_COUNTS,
  },
  accords: { title: 'Les accords', levels: [{ id: SINGLE_LEVEL, label: 'Niveau unique' }], questionCounts: [20] },
  // Aux harmonies, la précision fait partie du niveau : « Normal · Précise » n'est pas comparable à « Normal · Simple ».
  harmonies: {
    title: 'Les harmonies',
    levels: Object.entries(INTERVAL_LEVELS).flatMap(([level, cfg]) =>
      Object.entries(PRECISIONS).map(([precision, p]) => ({ id: `${level}-${precision}`, label: `${cfg.label} · ${p.label}` })),
    ),
    questionCounts: INTERVAL_COUNTS,
  },
  'lecture-note': {
    title: 'Lecture de note',
    levels: Object.entries(READ_LEVELS).map(([id, cfg]) => ({ id, label: cfg.label })),
    questionCounts: READ_COUNTS,
  },
}

export function isGameId(raw: unknown): raw is GameId {
  return typeof raw === 'string' && raw in GAMES
}

/** Libellé du niveau d'un classement. */
export function levelLabel(board: Board): string {
  return GAMES[board.game].levels.find((l) => l.id === board.level)?.label ?? board.level
}

/** Classement lu depuis une source non fiable (URL), avec repli sur le premier niveau et le nombre de questions le plus proche de 20. */
export function parseBoard(game: GameId, raw: { level?: unknown; questions?: unknown }): Board {
  const info = GAMES[game]
  const level = info.levels.some((l) => l.id === raw.level) ? String(raw.level) : info.levels[0].id
  const n = Number(raw.questions)
  const questions = info.questionCounts.includes(n) ? n : info.questionCounts.includes(20) ? 20 : info.questionCounts[0]
  return { game, level, questions }
}

/** Le score entre-t-il dans le classement ? (il faut au moins 1 point, et battre le 10ᵉ s'il est complet) */
export function qualifies(entries: readonly ScoreEntry[], points: number): boolean {
  if (points <= 0) return false
  return entries.length < MAX_ENTRIES || points > entries[entries.length - 1].points
}

/** Ajoute un score ; à points égaux, le plus ancien reste devant. Renvoie le nouveau classement et le rang (0 = premier). */
export function insertScore(entries: readonly ScoreEntry[], entry: ScoreEntry): { entries: ScoreEntry[]; rank: number } {
  const rank = entries.filter((e) => e.points >= entry.points).length
  const next = [...entries.slice(0, rank), entry, ...entries.slice(rank)].slice(0, MAX_ENTRIES)
  return { entries: next, rank: rank < MAX_ENTRIES ? rank : -1 }
}

/** Nom saisi par le joueur : espaces superflus retirés, 10 caractères au plus. */
export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)
}

/** Écran de jeu pour rejouer avec les réglages d'un classement. */
export function playHref({ game, level, questions }: Board): string {
  if (game === 'quelle-note') return afterSettings('quelle-note', level === 'expert', `questions=${questions}&level=${level}`)
  if (game === 'harmonies') {
    const [lvl, precision] = level.split('-')
    return `/games/harmonies/jouer?questions=${questions}&level=${lvl}&precision=${precision}`
  }
  if (game === 'lecture-note') return `/games/lecture-note/jouer?questions=${questions}&level=${level}`
  return `/games/${game}`
}

/** Page des scores d'un classement, avec éventuellement le rang à mettre en avant. */
export function scoresHref({ game, level, questions }: Board, rank?: number): string {
  return `/scores/${game}?level=${level}&questions=${questions}${rank !== undefined && rank >= 0 ? `&rang=${rank}` : ''}`
}

const STORAGE_KEY = 'harmowhat.scores'
const NAME_KEY = 'harmowhat.player'

const boardKey = ({ game, level, questions }: Board) => `${game}|${level}|${questions}`

function loadAll(): Record<string, ScoreEntry[]> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

export function getScores(board: Board): ScoreEntry[] {
  const list = loadAll()[boardKey(board)]
  return Array.isArray(list) ? list : []
}

/** Enregistre un score et renvoie son rang (0 = premier, -1 s'il n'entre pas). */
export function saveScore(board: Board, entry: ScoreEntry): number {
  const all = loadAll()
  const { entries, rank } = insertScore(getScores(board), entry)
  all[boardKey(board)] = entries
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    localStorage.setItem(NAME_KEY, entry.name)
  } catch {
    // Stockage indisponible : le score n'est pas gardé.
  }
  return rank
}

/** Dernier nom saisi, pour le proposer à la partie suivante. */
export function lastPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}
