import { afterSettings } from './ready'
import { LEVELS as NOTE_LEVELS, QUESTION_COUNTS as NOTE_COUNTS } from './nameTheNote'
import { LEVELS as INTERVAL_LEVELS, PRECISIONS, QUESTION_COUNTS as INTERVAL_COUNTS } from './intervals'
import { LEVELS as READ_LEVELS, QUESTION_COUNTS as READ_COUNTS } from './readNote'
import { LEVELS as HIGH_LOW_LEVELS, QUESTION_COUNTS as HIGH_LOW_COUNTS } from './highLow'
import { LEVELS as CHORD_LEVELS, QUESTION_COUNTS as CHORD_COUNTS } from './chords'
import { LEVELS as HARMONY_LEVELS, QUESTION_COUNTS as HARMONY_COUNTS } from './makeHarmony'
import { LEVELS as KEY_LEVELS, QUESTION_COUNTS as KEY_COUNTS } from './keySignature'
import { profile, saveProfile } from '@/player/profile'
import { SCORING_VERSION } from './scoring'

/**
 * Meilleurs scores : un classement par jeu, par niveau et par nombre de questions,
 * mémorisé sur l'appareil. Seuls les 10 meilleurs sont gardés.
 * Les scores sont aussi envoyés au classement mondial (voir worldScores.ts).
 */

export type GameId = 'grave-ou-aigu' | 'quelle-note' | 'accords' | 'harmonies' | 'lecture-note' | 'fais-harmonie' | 'tonalite'

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
  /** Identifiant technique du joueur (profil Mon compte) qui a fait ce score. */
  playerId?: string
}

export const MAX_ENTRIES = 10
export const MAX_NAME_LENGTH = 10

interface GameInfo {
  title: string
  /** Icône du jeu (accueil, bouton Jouer des meilleurs scores). */
  emoji: string
  /** Niveaux proposés (identifiant et libellé), dans l'ordre d'affichage. */
  levels: { id: string; label: string }[]
  questionCounts: readonly number[]
}

export const GAMES: Record<GameId, GameInfo> = {
  'grave-ou-aigu': {
    title: 'Grave ou aigu ?',
    emoji: '↕️',
    levels: Object.entries(HIGH_LOW_LEVELS).map(([id, cfg]) => ({ id, label: cfg.label })),
    questionCounts: HIGH_LOW_COUNTS,
  },
  'quelle-note': {
    title: 'Quelle est la note ?',
    emoji: '🎹',
    levels: Object.entries(NOTE_LEVELS).map(([id, cfg]) => ({ id, label: cfg.label })),
    questionCounts: NOTE_COUNTS,
  },
  accords: {
    title: 'Les accords',
    emoji: '🎼',
    levels: Object.entries(CHORD_LEVELS).map(([id, cfg]) => ({ id, label: cfg.label })),
    questionCounts: CHORD_COUNTS,
  },
  // Aux harmonies, la précision fait partie du niveau : « Normal · Précise » n'est pas comparable à « Normal · Simple ».
  harmonies: {
    title: 'Les harmonies',
    emoji: '🎵',
    levels: Object.entries(INTERVAL_LEVELS).flatMap(([level, cfg]) =>
      Object.entries(PRECISIONS).map(([precision, p]) => ({ id: `${level}-${precision}`, label: `${cfg.label} · ${p.label}` })),
    ),
    questionCounts: INTERVAL_COUNTS,
  },
  'lecture-note': {
    title: 'Lecture de note',
    emoji: '👀',
    levels: Object.entries(READ_LEVELS).map(([id, cfg]) => ({ id, label: cfg.label })),
    questionCounts: READ_COUNTS,
  },
  'fais-harmonie': {
    title: "Fais l'harmonie",
    emoji: '🎯',
    levels: Object.entries(HARMONY_LEVELS).map(([id, cfg]) => ({ id, label: cfg.label })),
    questionCounts: HARMONY_COUNTS,
  },
  tonalite: {
    title: 'La tonalité',
    emoji: '🔑',
    levels: Object.entries(KEY_LEVELS).map(([id, cfg]) => ({ id, label: cfg.label })),
    questionCounts: KEY_COUNTS,
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
export function qualifies(entries: readonly { points: number }[], points: number): boolean {
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
  return `/games/${game}/jouer?questions=${questions}&level=${level}`
}

/**
 * Page des scores d'un classement, avec éventuellement le score à mettre en avant :
 * son rang sur l'appareil, et son nom et ses points pour le retrouver dans le classement mondial.
 */
export function scoresHref({ game, level, questions }: Board, rank?: number, mine?: { name: string; points: number }): string {
  const rang = rank !== undefined && rank >= 0 ? `&rang=${rank}` : ''
  const me = mine ? `&nom=${encodeURIComponent(mine.name)}&pts=${mine.points}` : ''
  return `/scores/${game}?level=${level}&questions=${questions}${rang}${me}`
}

const STORAGE_KEY = 'harmowhat.scores'
const SCORING_VERSION_KEY = 'harmowhat.scoringVersion'

/**
 * Nouveau barème (10 000 points par question au lieu de 1000) : les scores de l'ancien barème ne sont pas
 * comparables, ils sont effacés une fois pour toutes (meilleurs scores de l'appareil, scores en attente d'envoi,
 * classements mondiaux en cache). Appelé au chargement de ce module, avant la lecture du cache mondial.
 */
export function resetScoresForNewScoring(): void {
  try {
    if (localStorage.getItem(SCORING_VERSION_KEY) === String(SCORING_VERSION)) return
    for (const key of [STORAGE_KEY, 'harmowhat.pendingScores', 'harmowhat.worldCache']) localStorage.removeItem(key)
    // Plus rien à envoyer de l'ancien barème au classement mondial.
    localStorage.setItem('harmowhat.localScoresUploaded', '1')
    localStorage.setItem(SCORING_VERSION_KEY, String(SCORING_VERSION))
  } catch {
    // Stockage indisponible : rien à effacer.
  }
}
resetScoresForNewScoring()

const boardKey = ({ game, level, questions }: Board) => `${game}|${level}|${questions}`

/** Classement correspondant à une clé de stockage (« jeu|niveau|questions »). */
export function boardOfKey(key: string): Board {
  const [game, level, questions] = key.split('|')
  return { game: game as GameId, level, questions: Number(questions) }
}

/**
 * Les anciens classements « niveau unique » (Grave ou aigu ?, Les accords, avant leurs réglages)
 * correspondent au niveau Normal : on les y range, en gardant les 10 meilleurs.
 */
export function migrateScores(all: Record<string, ScoreEntry[]>): Record<string, ScoreEntry[]> {
  const out: Record<string, ScoreEntry[]> = {}
  for (const [key, list] of Object.entries(all)) {
    const target = key.replace('|unique|', '|normal|')
    out[target] = out[target] ? [...out[target], ...list].sort((a, b) => b.points - a.points).slice(0, MAX_ENTRIES) : list
  }
  return out
}

function loadAll(): Record<string, ScoreEntry[]> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return raw && typeof raw === 'object' ? migrateScores(raw) : {}
  } catch {
    return {}
  }
}

export function getScores(board: Board): ScoreEntry[] {
  const list = loadAll()[boardKey(board)]
  return Array.isArray(list) ? list : []
}

/** Tous les scores enregistrés sur l'appareil, avec la clé de leur classement. */
export function localScoreList(): { key: string; entry: ScoreEntry }[] {
  return Object.entries(loadAll()).flatMap(([key, list]) => (Array.isArray(list) ? list.map((entry) => ({ key, entry })) : []))
}

/** Enregistre un score sur l'appareil et renvoie son rang (0 = premier, -1 s'il n'entre pas). */
export function saveScore(board: Board, entry: ScoreEntry): number {
  const all = loadAll()
  const { entries, rank } = insertScore(getScores(board), entry)
  all[boardKey(board)] = entries
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Stockage indisponible : le score n'est pas gardé.
  }
  // Premier nom saisi : il devient celui du profil (onglet Joueur des paramètres).
  if (!profile.value.name) saveProfile({ name: entry.name })
  return rank
}

/** Nom proposé en fin de partie : celui du profil (onglet Joueur des paramètres). */
export function lastPlayerName(): string {
  return profile.value.name
}
