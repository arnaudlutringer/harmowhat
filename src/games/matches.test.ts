import { describe, expect, it } from 'vitest'
import { seededRandom, withSeed } from './seed'
import { createChordQuestion } from './chords'
import { createRhythmQuestion } from './rhythm'

// matches.ts parle à Supabase : on n'en teste que les fonctions pures, chargées sans base configurée.
const { newCode, outcomeFor, parseCode, matchLink } = await import('./matches')

describe('Graine des matchs', () => {
  it('la même graine donne les mêmes nombres, une autre graine d’autres', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    const c = seededRandom(43)
    const first = [a(), a(), a()]
    expect([b(), b(), b()]).toEqual(first)
    expect([c(), c(), c()]).not.toEqual(first)
  })

  it('les deux joueurs reçoivent les mêmes questions, et Math.random redevient le vrai hasard', () => {
    const original = Math.random
    const q1 = withSeed(1234, () => createChordQuestion('expert'))
    const q2 = withSeed(1234, () => createChordQuestion('expert'))
    expect(q2.notes).toEqual(q1.notes)
    expect(q2.choices).toEqual(q1.choices)
    expect(withSeed(99, () => createRhythmQuestion('impossible'))).toEqual(withSeed(99, () => createRhythmQuestion('impossible')))
    expect(Math.random).toBe(original)
  })
})

describe('Matchs', () => {
  it('codes de 6 caractères faciles à dicter, saisie nettoyée', () => {
    for (let i = 0; i < 50; i++) expect(newCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    expect(parseCode(' abc 12x ')).toBe('ABC12X')
    expect(parseCode('ABC')).toBeNull()
    expect(matchLink('ABC123')).toBe('loreille://match/ABC123')
  })

  it('résultat du point de vue de chaque joueur', () => {
    const m = {
      creator_id: 'a', creator_points: 5000, opponent_id: 'b', opponent_points: 4000,
    } as Parameters<typeof outcomeFor>[0]
    expect(outcomeFor(m, 'a')).toBe('victoire')
    expect(outcomeFor(m, 'b')).toBe('defaite')
    expect(outcomeFor({ ...m, opponent_points: 5000 }, 'b')).toBe('nul')
    expect(outcomeFor({ ...m, opponent_points: null }, 'a')).toBeNull()
  })
})
