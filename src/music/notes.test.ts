import { describe, expect, it } from 'vitest'
import { frequency, noteName, randomPianoNote, PIANO_LOWEST, PIANO_HIGHEST, A440 } from './notes'

describe('notes', () => {
  it('La3 vaut 440 Hz', () => {
    expect(frequency(A440)).toBe(440)
    expect(noteName(A440)).toBe('La3')
  })

  it('nomme les extrémités du piano', () => {
    expect(noteName(PIANO_LOWEST)).toBe('La-1')
    expect(noteName(60)).toBe('Do3')
    expect(noteName(PIANO_HIGHEST)).toBe('Do7')
    expect(frequency(PIANO_LOWEST)).toBeCloseTo(27.5)
  })

  it('tire une touche du piano hors exclusions', () => {
    for (let i = 0; i < 500; i++) {
      const n = randomPianoNote([A440])
      expect(n).not.toBe(A440)
      expect(n).toBeGreaterThanOrEqual(PIANO_LOWEST)
      expect(n).toBeLessThanOrEqual(PIANO_HIGHEST)
    }
  })
})
