import { describe, expect, it } from 'vitest'
import { dailyChallenge, dayNumber, isDailyChallenge } from './dailyChallenge'
import { GAMES } from './highScores'

describe('Défi du jour', () => {
  const day = (d: number) => new Date(2026, 10, d, 15)

  it('le même toute la journée, un autre jeu le lendemain', () => {
    expect(dailyChallenge(new Date(2026, 10, 3, 0, 5))).toEqual(dailyChallenge(new Date(2026, 10, 3, 23, 50)))
    for (let d = 1; d < 28; d++) expect(dailyChallenge(day(d)).board.game).not.toBe(dailyChallenge(day(d + 1)).board.game)
  })

  it('tous les jeux reviennent, sauf « Garde le tempo », jamais en Impossible', () => {
    const games = new Set<string>()
    for (let d = 0; d < 40; d++) {
      const c = dailyChallenge(new Date(2026, 0, 1 + d, 12))
      games.add(c.board.game)
      expect(c.board.level.startsWith('impossible')).toBe(false)
      expect(GAMES[c.board.game].questionCounts).toContain(c.board.questions)
      expect(c.href).toMatch(/^\/games\//)
    }
    expect(games.size).toBe(Object.keys(GAMES).length - 3)
    expect(games.has('garde-tempo')).toBe(false)
  })

  it('niveau adapté : le premier pas encore réussi (50 % ou plus), sinon le plus difficile', () => {
    const d = day(9)
    const game = dailyChallenge(d, {}).board.game
    const ids = GAMES[game].levels.map((l) => l.id).filter((id) => !id.startsWith('impossible'))
    expect(dailyChallenge(d, {}).board.level).toBe(ids[0])
    expect(dailyChallenge(d, { [game]: { [ids[0]]: 0.4 } }).board.level).toBe(ids[0])
    expect(dailyChallenge(d, { [game]: { [ids[0]]: 0.6 } }).board.level).toBe(ids[1])
    expect(dailyChallenge(d, { [game]: Object.fromEntries(ids.map((id) => [id, 1])) }).board.level).toBe(ids.at(-1))
  })

  it('reconnaît la partie du défi', () => {
    const c = dailyChallenge(day(5))
    expect(isDailyChallenge(c.board, day(5))).toBe(true)
    expect(isDailyChallenge({ ...c.board, questions: c.board.questions + 1 }, day(5))).toBe(false)
    expect(dayNumber(day(6)) - dayNumber(day(5))).toBe(1)
  })
})
