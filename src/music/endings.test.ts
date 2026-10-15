import { describe, expect, it } from 'vitest'
import { endingFor } from './endings'
import { INSTRUMENTS, type InstrumentId } from '@/audio/instruments'
import { pitchClassName } from './notes'

describe('Musique de fin', () => {
  it('joue le Printemps de Vivaldi au violon, la Lettre à Élise sinon', () => {
    expect(endingFor('violin').title).toBe('Le Printemps')
    expect(endingFor('piano').title).toBe('La Lettre à Élise')
    expect(endingFor('cello').title).toBe('La Lettre à Élise')
  })

  it('Le Printemps : thème en mi majeur, une dizaine de secondes, dans la tessiture du violon', () => {
    const { notes, unit } = endingFor('violin')
    expect(notes.slice(0, 7).map((n) => pitchClassName(n.midi))).toEqual(['Mi', 'Sol♯', 'Sol♯', 'Sol♯', 'Fa♯', 'Mi', 'Si'])
    const end = Math.max(...notes.map((n) => n.at + n.len)) * unit
    expect(end).toBeGreaterThan(9)
    expect(end).toBeLessThan(11.5)
    const violin = INSTRUMENTS.violin
    for (const n of notes) {
      expect(n.midi).toBeGreaterThanOrEqual(violin.low)
      expect(n.midi).toBeLessThanOrEqual(violin.high)
    }
  })

  it('existe pour chaque instrument', () => {
    for (const id of Object.keys(INSTRUMENTS) as InstrumentId[]) expect(endingFor(id).notes.length).toBeGreaterThan(10)
  })
})
