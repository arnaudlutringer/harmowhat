/**
 * Points d'une question : 10 000 au départ ; le décompte démarre 50 ms après le début du premier son,
 * plus une marge de 0,3 s (voir GRACE_MS), et descend jusqu'au plancher de 100 en 9 s (1,1 point par milliseconde) ; moins 200 par réécoute et
 * 200 par coup de diapason. Jamais en dessous de 100 : une bonne réponse rapporte toujours un minimum.
 */

export const START_POINTS = 10000
export const MIN_POINTS = 100
/** Durée pour descendre du score de départ au plancher. */
export const COUNTDOWN_MS = 9000
export const POINTS_PER_MS = (START_POINTS - MIN_POINTS) / COUNTDOWN_MS
/** Délai entre le début du premier son et le début du décompte. */
export const COUNTDOWN_DELAY_MS = 50
/** Marge en plus, pendant laquelle on peut déjà répondre : une réponse très rapide garde les 10 000 points. */
export const GRACE_MS = 300
export const REPLAY_PENALTY = 200
export const TUNING_FORK_PENALTY = 200
/** Version du barème : les scores d'un barème précédent ne sont pas comparables (voir highScores.ts). */
export const SCORING_VERSION = 2

export function pointsLeft(elapsedMs: number, penalties: number): number {
  return Math.max(MIN_POINTS, Math.round(START_POINTS - elapsedMs * POINTS_PER_MS - penalties))
}

/** Chronomètre d'une question : démarre peu après le début de la première écoute, s'arrête à la réponse. */
export class QuestionClock {
  private startedAt: number | null = null
  private stoppedAt: number | null = null
  private pausedAt: number | null = null
  private penalties = 0

  constructor(private readonly now: () => number = () => performance.now()) {}

  get running(): boolean {
    return this.startedAt !== null && this.stoppedAt === null && this.pausedAt === null
  }

  get points(): number {
    const end = this.stoppedAt ?? this.pausedAt ?? this.now()
    return pointsLeft(this.startedAt === null ? 0 : end - this.startedAt, this.penalties)
  }

  /** Met le décompte en pause (ex. pendant la popin « Quitter la partie ? »). */
  pause(): void {
    if (this.running) this.pausedAt = this.now()
  }

  /** Reprend le décompte là où il s'était arrêté : le temps de pause ne compte pas. */
  resume(): void {
    if (this.pausedAt === null) return
    if (this.startedAt !== null) this.startedAt += this.now() - this.pausedAt
    this.pausedAt = null
  }

  start(): void {
    if (this.startedAt === null) this.startedAt = this.now()
  }

  /** Retire des points (sans effet une fois la réponse donnée). */
  penalize(amount: number): void {
    if (this.stoppedAt === null) this.penalties += amount
  }

  /** Fige les points et les renvoie. */
  stop(): number {
    this.resume()
    if (this.startedAt === null) this.startedAt = this.now()
    if (this.stoppedAt === null) this.stoppedAt = this.now()
    return this.points
  }
}

export interface QuestionResult {
  correct: boolean
  /** Points gagnés : ceux du chronomètre si la réponse est juste, 0 sinon. */
  points: number
}

export function summarize(results: QuestionResult[]): { correct: number; points: number } {
  return {
    correct: results.filter((r) => r.correct).length,
    points: results.reduce((sum, r) => sum + r.points, 0),
  }
}
