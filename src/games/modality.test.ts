import { describe, expect, it } from 'vitest'
import { spelledPitchName } from '@/music/spelling'
import { createQuestion, MODES, parseSettings, scaleNotes, TONIC_HIGH, TONIC_LOW } from './modality'

const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]

describe('La modalité', () => {
  it('chaque mode, joué depuis sa note sur les touches blanches, ne prend aucune altération', () => {
    for (const [i, mode] of MODES.entries()) {
      const tonic = { midi: 60 + LETTER_PC[i], letter: i, alter: 0 as const }
      const notes = scaleNotes(mode, tonic)!
      expect(notes.map(spelledPitchName)[0]).toBe(mode.white)
      expect(notes.every((n) => n.alter === 0)).toBe(true)
    }
    expect(MODES.find((m) => m.id === 'dorien')!.steps).toEqual([2, 1, 2, 2, 2, 1, 2])
    expect(MODES.find((m) => m.id === 'lydien')!.steps).toEqual([2, 2, 2, 1, 2, 2, 1])
  })

  it('transpose un mode avec les dièses et bémols sur les notes : Ré lydien, Mi♭ phrygien', () => {
    const lydian = MODES.find((m) => m.id === 'lydien')!
    expect(scaleNotes(lydian, { midi: 62, letter: 1, alter: 0 })!.map(spelledPitchName)).toEqual(['Ré', 'Mi', 'Fa♯', 'Sol♯', 'La', 'Si', 'Do♯', 'Ré'])
    const phrygian = MODES.find((m) => m.id === 'phrygien')!
    expect(scaleNotes(phrygian, { midi: 63, letter: 2, alter: -1 })!.map(spelledPitchName)).toEqual(['Mi♭', 'Fa♭', 'Sol♭', 'La♭', 'Si♭', 'Do♭', 'Ré♭', 'Mi♭'])
    // Sol♯ lydien demanderait un Do double dièse : écarté.
    expect(scaleNotes(lydian, { midi: 56, letter: 4, alter: 1 })).toBeNull()
  })

  it('tire des gammes bien formées dans les sept modes', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i++) {
      const q = createQuestion()
      seen.add(q.mode.id)
      expect(q.notes).toHaveLength(8)
      expect(q.notes[0].midi).toBeGreaterThanOrEqual(TONIC_LOW)
      expect(q.notes[0].midi).toBeLessThanOrEqual(TONIC_HIGH)
      expect(q.notes[7].midi - q.notes[0].midi).toBe(12)
      q.notes.slice(1).forEach((n, k) => {
        expect(n.midi - q.notes[k].midi).toBe(q.mode.steps[k]) // Bons écarts.
        expect(n.letter).toBe((q.notes[0].letter + k + 1) % 7) // Une lettre par degré.
        expect(Math.abs(n.alter)).toBeLessThanOrEqual(1)
      })
    }
    expect(seen.size).toBe(7)
  })

  it('lit les réglages avec repli sur les valeurs par défaut', () => {
    expect(parseSettings({ questions: '10', level: 'expert' })).toEqual({ questions: 10, level: 'expert' })
    expect(parseSettings({ level: 'x' })).toEqual({ questions: 20, level: 'debutant' })
  })
})
