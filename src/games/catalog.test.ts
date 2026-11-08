import { describe, expect, it } from 'vitest'
import { BLURBS, FAMILIES, gameFamilyPath, gameMedals, medalsText } from './catalog'
import { GAME_ICONS } from './icons'
import type { GameId } from './highScores'

describe('Rangement des jeux', () => {
  it('range chaque jeu dans une seule famille, avec sa description', () => {
    const ranged = FAMILIES.flatMap((f) => f.games)
    expect([...ranged].sort()).toEqual(Object.keys(GAME_ICONS).sort())
    for (const game of ranged) expect(BLURBS[game]).toBeTruthy()
  })

  it('ramène un jeu à sa famille', () => {
    expect(gameFamilyPath('garde-tempo')).toBe('/famille/rythme')
    expect(gameFamilyPath('lis-dis')).toBe('/famille/solfege')
  })

  it('compte bronze, argent, or et diamant pour chaque jeu', () => {
    const games: GameId[] = ['accords', 'harmonies']
    expect(gameMedals('accords')).toHaveLength(4)
    expect(medalsText(games)).toBe('0 médaille sur 8')
  })
})
