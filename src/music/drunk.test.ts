import { describe, expect, it } from 'vitest'
import { drunk } from './drunk'
import { FUR_ELISE } from './furElise'

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const end = (notes: readonly { at: number; len: number }[]) => Math.max(...notes.map((n) => n.at + n.len))

describe('Musique de fin jouée par un musicien éméché', () => {
  it('sans erreur, le morceau est joué tel quel', () => {
    const played = drunk(FUR_ELISE, 0, seeded(1))
    expect(played).toEqual(FUR_ELISE.map((n) => ({ ...n })))
  })

  it('avec beaucoup d’erreurs : notes fausses, notes en trop, rythme et tenues bousculés', () => {
    const played = drunk(FUR_ELISE, 1, seeded(2))
    const original = new Set(FUR_ELISE.map((n) => `${n.midi}@${n.at}`))
    const exact = played.filter((n) => original.has(`${n.midi}@${n.at}`))
    expect(exact.length).toBeLessThan(FUR_ELISE.length * 0.2)
    expect(played.length).toBeGreaterThan(FUR_ELISE.length)
    // Plusieurs notes attaquées presque ensemble là où il n'y en avait qu'une.
    const clusters = played.filter((n, i) => i > 0 && Math.abs(n.at - played[i - 1].at) < 0.2 && n.midi !== played[i - 1].midi)
    expect(clusters.length).toBeGreaterThan(5)
  })

  it('reste reconnaissable : notes à deux demi-tons au plus, durée comparable, dans l’ordre', () => {
    for (const seed of [3, 4, 5]) {
      const played = drunk(FUR_ELISE, 1, seeded(seed))
      const pitches = new Set(FUR_ELISE.map((n) => n.midi))
      played.forEach((n, i) => {
        expect([...pitches].some((p) => Math.abs(p - n.midi) <= 2)).toBe(true)
        expect(n.at).toBeGreaterThanOrEqual(0)
        if (i > 0) expect(n.at).toBeGreaterThanOrEqual(played[i - 1].at)
      })
      expect(end(played)).toBeLessThan(end(FUR_ELISE) * 2)
    }
  })

  it('les défauts augmentent avec la part d’erreurs', () => {
    const wrong = (ratio: number) => {
      const original = new Set(FUR_ELISE.map((n) => n.midi + '@' + n.at))
      return drunk(FUR_ELISE, ratio, seeded(6)).filter((n) => !original.has(n.midi + '@' + n.at)).length
    }
    expect(wrong(0.2)).toBeLessThan(wrong(0.6))
    expect(wrong(0.6)).toBeLessThan(wrong(1))
  })
})
