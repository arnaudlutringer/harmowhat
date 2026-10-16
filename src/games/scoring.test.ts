import { describe, expect, it } from 'vitest'
import { COUNTDOWN_DELAY_MS, MIN_POINTS, pointsLeft, QuestionClock, REPLAY_PENALTY, START_POINTS, summarize, TUNING_FORK_PENALTY } from './scoring'

function fakeClock() {
  let t = 0
  const clock = new QuestionClock(() => t)
  return { clock, advance: (ms: number) => (t += ms) }
}

describe('Pause du décompte', () => {
  it('ne retire pas de points pendant la pause (popin « Quitter la partie ? »)', () => {
    const { clock, advance } = fakeClock()
    clock.start()
    advance(2000)
    const before = clock.points
    clock.pause()
    expect(clock.running).toBe(false)
    advance(10000)
    expect(clock.points).toBe(before)
    clock.resume()
    expect(clock.points).toBe(before)
    advance(2000)
    expect(clock.points).toBe(pointsLeft(4000, 0))
  })
})

describe('Points par question', () => {
  it('part de 10 000 et descend au plancher de 100 en 9 s (1,1 point par ms), sans aller en dessous', () => {
    expect(START_POINTS).toBe(10000)
    expect(MIN_POINTS).toBe(100)
    expect(COUNTDOWN_DELAY_MS).toBe(50)
    expect(pointsLeft(0, 0)).toBe(START_POINTS)
    expect(pointsLeft(1000, 0)).toBe(8900)
    expect(pointsLeft(4500, 0)).toBe(5050)
    expect(pointsLeft(4500, 400)).toBe(4650)
    expect(pointsLeft(9000, 0)).toBe(MIN_POINTS)
    expect(pointsLeft(15000, 0)).toBe(MIN_POINTS)
    expect(pointsLeft(1000, 9000)).toBe(MIN_POINTS)
  })

  it('ne décompte rien avant la première écoute', () => {
    const { clock, advance } = fakeClock()
    advance(500)
    expect(clock.points).toBe(10000)
    expect(clock.running).toBe(false)
    clock.start()
    advance(3000)
    expect(clock.points).toBe(6700)
    expect(clock.running).toBe(true)
  })

  it('retire 200 par réécoute et 200 par diapason, et se fige à la réponse', () => {
    expect(REPLAY_PENALTY).toBe(200)
    expect(TUNING_FORK_PENALTY).toBe(200)
    const { clock, advance } = fakeClock()
    clock.start()
    advance(1000)
    clock.penalize(REPLAY_PENALTY)
    clock.penalize(TUNING_FORK_PENALTY)
    expect(clock.stop()).toBe(8500)
    advance(1000)
    clock.penalize(REPLAY_PENALTY)
    expect(clock.points).toBe(8500)
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
