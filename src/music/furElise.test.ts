import { describe, expect, it } from 'vitest'
import { FUR_ELISE, FUR_ELISE_SIXTEENTH } from './furElise'
import { PIANO_HIGHEST, PIANO_LOWEST, pitchClassName } from './notes'

describe('La Lettre à Élise', () => {
  it('commence par mi ré♯ mi ré♯ mi si ré do la', () => {
    const melody = FUR_ELISE.filter((n) => n.at < 9 && n.midi >= 69).map((n) => pitchClassName(n.midi))
    expect(melody).toEqual(['Mi', 'Ré♯', 'Mi', 'Ré♯', 'Mi', 'Si', 'Ré', 'Do', 'La'])
  })

  it('dure une dizaine de secondes, notes dans le clavier et dans l’ordre', () => {
    const end = Math.max(...FUR_ELISE.map((n) => n.at + n.len)) * FUR_ELISE_SIXTEENTH
    expect(end).toBeGreaterThan(9)
    expect(end).toBeLessThan(11)
    FUR_ELISE.forEach((n, i) => {
      expect(n.midi).toBeGreaterThanOrEqual(PIANO_LOWEST)
      expect(n.midi).toBeLessThanOrEqual(PIANO_HIGHEST)
      if (i > 0) expect(n.at).toBeGreaterThanOrEqual(FUR_ELISE[i - 1].at)
    })
  })
})
