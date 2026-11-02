import { GAMES, levelLabel, playHref, type Board, type GameId } from './highScores'
import { bestResults } from './trophies'

/**
 * Défi du jour : chaque jour, un jeu (le même pour tout le monde) en 10 questions (ou le nombre le plus proche),
 * à un niveau adapté au joueur : le premier niveau où il n'a pas encore fait 50 % de bonnes réponses (la médaille
 * d'argent de fin de partie), c'est-à-dire le niveau au-dessus du dernier réussi, ou le même s'il ne l'a pas encore réussi.
 * Il est relevé avec au moins 80 % de bonnes réponses ; un trophée récompense le premier défi relevé, un autre le septième.
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

/** Part de bonnes réponses qui vaut la médaille d'argent de fin de partie : le niveau est réussi. */
export const LEVEL_PASSED = 0.5

export function dailyChallenge(date = new Date(), progress: Partial<Record<GameId, Record<string, number>>> = bestResults.value): DailyChallenge {
  const n = dayNumber(date)
  // 5 est premier avec le nombre de jeux : d'un jour à l'autre, le jeu change, et tous reviennent tour à tour.
  const game = POOL[(n * 5) % POOL.length]
  const info = GAMES[game]
  const levels = info.levels.filter((l) => !l.id.startsWith('impossible'))
  // Le premier niveau pas encore réussi (au moins 50 %), ou le plus difficile (hors Impossible) si tous le sont.
  const best = progress[game] ?? {}
  const level = levels.find((l) => (best[l.id] ?? 0) < LEVEL_PASSED) ?? levels[levels.length - 1]
  const questions = [...info.questionCounts].sort((a, b) => Math.abs(a - 10) - Math.abs(b - 10))[0]
  const board = { game, level: level.id, questions }
  return { board, title: info.title, level: levelLabel(board), href: playHref(board) }
}

/** La partie jouée est-elle le défi du jour ? */
export function isDailyChallenge(board: Board, date = new Date(), progress = bestResults.value): boolean {
  const c = dailyChallenge(date, progress).board
  return c.game === board.game && c.level === board.level && c.questions === board.questions
}
