import { GAMES, levelLabel, playHref, type Board, type GameId } from './highScores'

/**
 * Défi du jour : chaque jour, un jeu et un niveau proposés à tous les joueurs (le même pour tout le monde),
 * en 10 questions (ou le nombre le plus proche que propose le jeu). Il est relevé avec au moins 80 % de
 * bonnes réponses ; un trophée récompense le premier défi relevé, un autre le septième.
 */

/** « Garde le tempo » n'a pas de nombre de questions : il n'entre pas dans les défis. */
const POOL = (Object.keys(GAMES) as GameId[]).filter((g) => g !== 'garde-tempo')

/** Part de bonnes réponses pour relever le défi. */
export const CHALLENGE_SUCCESS = 0.8

/** Numéro du jour (date locale du téléphone), qui change à minuit. */
export function dayNumber(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
}

export interface DailyChallenge {
  board: Board
  title: string
  level: string
  href: string
}

export function dailyChallenge(date = new Date()): DailyChallenge {
  const n = dayNumber(date)
  // 5 est premier avec le nombre de jeux : d'un jour à l'autre, le jeu change, et tous reviennent tour à tour.
  const game = POOL[(n * 5) % POOL.length]
  const info = GAMES[game]
  const levels = info.levels.filter((l) => !l.id.startsWith('impossible'))
  // Deux jours sur trois au niveau intermédiaire, le troisième au plus difficile (hors Impossible).
  const level = n % 3 === 2 ? levels[levels.length - 1] : levels[Math.min(levels.length - 1, Math.floor((levels.length - 1) / 2))]
  const questions = [...info.questionCounts].sort((a, b) => Math.abs(a - 10) - Math.abs(b - 10))[0]
  const board = { game, level: level.id, questions }
  return { board, title: info.title, level: levelLabel(board), href: playHref(board) }
}

/** La partie jouée est-elle le défi du jour ? */
export function isDailyChallenge(board: Board, date = new Date()): boolean {
  const c = dailyChallenge(date).board
  return c.game === board.game && c.level === board.level && c.questions === board.questions
}
