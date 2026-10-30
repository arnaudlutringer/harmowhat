import { afterEach, describe, expect, it, vi } from 'vitest'
import { useQuiz } from './useQuiz'
import { COUNTDOWN_DELAY_MS, GRACE_MS, START_POINTS } from '@/games/scoring'

describe('Marge avant le décompte des points', () => {
  afterEach(() => vi.useRealTimers())

  async function quizAfter(ms: number, options: Partial<Parameters<typeof useQuiz>[0]> = {}) {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    const quiz = useQuiz({ total: 1, createQuestion: () => 1, play: () => Promise.resolve(1), ...options })
    await quiz.listen()
    await vi.advanceTimersByTimeAsync(ms)
    quiz.answer(true, '')
    return quiz.results.value[0]
  }

  it('une réponse donnée pendant la marge garde les 10 000 points', async () => {
    expect(await quizAfter(COUNTDOWN_DELAY_MS + GRACE_MS - 20)).toEqual({ correct: true, points: START_POINTS })
  })

  it('après la marge, les points baissent', async () => {
    expect((await quizAfter(COUNTDOWN_DELAY_MS + GRACE_MS + 500)).points).toBeLessThan(START_POINTS)
  })

  it('avec un délai propre au jeu, la marge vient après lui', async () => {
    const options = { countdownStart: () => 2000 }
    expect((await quizAfter(2000 + GRACE_MS - 20, options)).points).toBe(START_POINTS)
    expect((await quizAfter(2000 + GRACE_MS + 500, options)).points).toBeLessThan(START_POINTS)
  })
})
