import { describe, expect, it } from 'vitest'
import { CHOICE_COUNT, CHORD_HIGH, CHORD_LOW, clefFor, createChordQuestion, isCorrect } from './chords'

describe('Les accords', () => {
  it('tire 3 notes distinctes entre La2 et La4, toutes proposées', () => {
    for (let i = 0; i < 300; i++) {
      const q = createChordQuestion()
      expect(new Set(q.notes).size).toBe(3)
      expect(new Set(q.choices).size).toBe(CHOICE_COUNT)
      for (const n of q.choices) {
        expect(n).toBeGreaterThanOrEqual(CHORD_LOW)
        expect(n).toBeLessThanOrEqual(CHORD_HIGH)
      }
      for (const n of q.notes) expect(q.choices).toContain(n)
      expect([...q.choices].sort((a, b) => a - b)).toEqual(q.choices)
      for (const n of q.choices) expect(q.spelled[n].midi).toBe(n)
    }
  })

  it('valide uniquement les 3 bonnes notes', () => {
    expect(isCorrect([64, 60, 67], [60, 64, 67])).toBe(true)
    expect(isCorrect([60, 64, 68], [60, 64, 67])).toBe(false)
    expect(isCorrect([60, 64], [60, 64, 67])).toBe(false)
  })

  it('choisit la clé selon le registre', () => {
    expect(clefFor([60, 64, 67])).toBe('treble')
    expect(clefFor([57, 59, 64])).toBe('bass')
  })
})
