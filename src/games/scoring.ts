/**
 * Points d'une question : 1000 au départ, moins 1 toutes les 10 millisecondes à partir de la
 * fin de la première écoute (donc 100 au bout de 9 s), moins 100 par réécoute ou par coup de
 * diapason. Jamais en dessous de 100 : une bonne réponse rapporte toujours un minimum.
 */

export const START_POINTS = 1000
export const MIN_POINTS = 100
export const POINTS_PER_MS = 0.1
export const REPLAY_PENALTY = 100
export const TUNING_FORK_PENALTY = 100

export function pointsLeft(elapsedMs: number, penalties: number): number {
  return Math.max(MIN_POINTS, Math.round(START_POINTS - elapsedMs * POINTS_PER_MS - penalties))
}

/** Chronomètre d'une question : démarre à la fin de la première écoute, s'arrête à la réponse. */
export class QuestionClock {
  private startedAt: number | null = null
  private stoppedAt: number | null = null
  private penalties = 0

  constructor(private readonly now: () => number = () => performance.now()) {}

  get running(): boolean {
    return this.startedAt !== null && this.stoppedAt === null
  }

  get points(): number {
    const end = this.stoppedAt ?? this.now()
    return pointsLeft(this.startedAt === null ? 0 : end - this.startedAt, this.penalties)
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
