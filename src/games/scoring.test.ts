import { describe, expect, it } from 'vitest'
import { MIN_POINTS, pointsLeft, QuestionClock, REPLAY_PENALTY, START_POINTS, summarize, TUNING_FORK_PENALTY } from './scoring'

function fakeClock() {
  let t = 0
  const clock = new QuestionClock(() => t)
  return { clock, advance: (ms: number) => (t += ms) }
}

describe('Points par question', () => {
  it('part de 1000 et perd 1 point toutes les 10 ms, sans descendre sous 100', () => {
    expect(pointsLeft(0, 0)).toBe(START_POINTS)
    expect(pointsLeft(2500, 0)).toBe(750)
    expect(pointsLeft(2500, 200)).toBe(550)
    expect(pointsLeft(9000, 0)).toBe(MIN_POINTS)
    expect(pointsLeft(15000, 0)).toBe(MIN_POINTS)
    expect(pointsLeft(1000, 1500)).toBe(MIN_POINTS)
  })

  it('ne décompte rien avant la première écoute', () => {
    const { clock, advance } = fakeClock()
    advance(500)
    expect(clock.points).toBe(1000)
    expect(clock.running).toBe(false)
    clock.start()
    advance(3000)
    expect(clock.points).toBe(700)
    expect(clock.running).toBe(true)
  })

  it('retire 100 par réécoute ou diapason, et se fige à la réponse', () => {
    const { clock, advance } = fakeClock()
    clock.start()
    advance(1000)
    clock.penalize(REPLAY_PENALTY)
    clock.penalize(TUNING_FORK_PENALTY)
    expect(clock.stop()).toBe(700)
    advance(1000)
    clock.penalize(REPLAY_PENALTY)
    expect(clock.points).toBe(700)
    expect(clock.running).toBe(false)
  })

  it('totalise les bonnes réponses et les points', () => {
    expect(
      summarize([
        { correct: true, points: 640 },
        { correct: false, points: 0 },
        { correct: true, points: 120 },
      ]),
    ).toEqual({ correct: 2, points: 760 })
    expect(summarize([])).toEqual({ correct: 0, points: 0 })
  })
})
