import { describe, expect, it } from 'vitest'
import { endingFor } from './endings'
import { INSTRUMENTS, type InstrumentId } from '@/audio/instruments'
import { pitchClassName } from './notes'

describe('Musique de fin', () => {
  it('joue le Printemps au violon, les Patineurs à l’accordéon, Bella ciao à la clarinette, la Lettre à Élise sinon', () => {
    expect(endingFor('violin').title).toBe('Le Printemps')
    expect(endingFor('accordion').title).toBe('Les Patineurs')
    expect(endingFor('clarinet').title).toBe('Bella ciao')
    expect(endingFor('piano').title).toBe('La Lettre à Élise')
    expect(endingFor('cello').title).toBe('La Lettre à Élise')
  })

  /** Fin du morceau en secondes, et toutes les notes dans la tessiture de l'instrument. */
  function check(id: InstrumentId) {
    const { notes, unit } = endingFor(id)
    for (const n of notes) {
      expect(n.midi).toBeGreaterThanOrEqual(INSTRUMENTS[id].low)
      expect(n.midi).toBeLessThanOrEqual(INSTRUMENTS[id].high)
    }
    return Math.max(...notes.map((n) => n.at + n.len)) * unit
  }

  it('Les Patineurs : thème en sol majeur avec accompagnement de valse, une dizaine de secondes', () => {
    const { notes } = endingFor('accordion')
    expect(notes.slice(0, 7).map((n) => pitchClassName(n.midi))).toEqual(['Si', 'Ré', 'Mi', 'Mi', 'Do', 'Mi', 'Fa♯'])
    expect(notes.some((n) => n.at === 1 && n.midi < 70)).toBe(true)
    const end = check('accordion')
    expect(end).toBeGreaterThan(9)
    expect(end).toBeLessThan(12)
  })

  it('Bella ciao : couplet en sol mineur, une dizaine de secondes', () => {
    const { notes } = endingFor('clarinet')
    expect(notes.slice(0, 5).map((n) => pitchClassName(n.midi))).toEqual(['Ré', 'Sol', 'La', 'La♯', 'Sol'])
    expect(pitchClassName(notes[notes.length - 1].midi)).toBe('Sol')
    const end = check('clarinet')
    expect(end).toBeGreaterThan(9)
    expect(end).toBeLessThan(12)
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
