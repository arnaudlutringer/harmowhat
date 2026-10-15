import { describe, expect, it } from 'vitest'
import { endingFor, endingsFor, ENDINGS, INSTRUMENT_ENDINGS } from './endings'
import { INSTRUMENTS, type InstrumentId } from '@/audio/instruments'
import { pitchClassName } from './notes'

describe('Musique de fin', () => {
  it('joue le Printemps au violon, les Patineurs à l’accordéon, Bella ciao à la clarinette, la Lettre à Élise sinon', () => {
    expect(endingFor('violin').title).toBe('Le Printemps')
    expect(endingFor('accordion').title).toBe('Les Patineurs')
    expect(endingFor('clarinet').title).toBe('Bella ciao')
    expect(endingFor('guitar').title).toBe('Romance (Jeux interdits)')
    expect(endingFor('piano').title).toBe('La Lettre à Élise')
    expect(endingFor('cello').title).toBe('La Lettre à Élise')
  })

  it('propose plusieurs morceaux au piano et joue celui choisi, s’il est proposé pour l’instrument', () => {
    expect(endingsFor('piano').map((e) => e.title)).toEqual(['La Lettre à Élise', 'Sonate au clair de lune (3ᵉ mvt)', 'Marche turque'])
    expect(endingFor('piano', { piano: 'moonlight' }).id).toBe('moonlight')
    expect(endingFor('violin', { violin: 'moonlight' }).id).toBe('spring')
    expect(endingFor('piano', {}).id).toBe('elise')
    for (const id of Object.keys(INSTRUMENTS) as InstrumentId[]) expect(INSTRUMENT_ENDINGS[id].length).toBeGreaterThan(0)
  })

  it('Sonate au clair de lune : arpèges de do♯ mineur en doubles croches, accords sforzando, une dizaine de secondes', () => {
    const { notes, unit } = ENDINGS.moonlight
    const right = notes.filter((n) => n.at < 8 && n.midi >= 44 && n.at % 1 === 0 && n.at % 2 === 1)
    expect(right.map((n) => pitchClassName(n.midi))).toEqual(['Sol♯', 'Mi', 'Do♯', 'Sol♯'])
    expect(notes.filter((n) => n.at === 28).length).toBe(6)
    const end = Math.max(...notes.map((n) => n.at + n.len)) * unit
    expect(end).toBeGreaterThan(9)
    expect(end).toBeLessThan(11)
    for (const n of notes) {
      expect(n.midi).toBeGreaterThanOrEqual(INSTRUMENTS.piano.low)
      expect(n.midi).toBeLessThanOrEqual(INSTRUMENTS.piano.high)
    }
  })

  it('Marche turque : si la sol♯ la do, ré do si do, mi…, cadence sur le mi, une dizaine de secondes', () => {
    const { notes, unit } = ENDINGS['turkish-march']
    const melody = notes.filter((n) => n.midi >= 68 && n.at < 20 && n.at % 1 === 0)
    expect(melody.slice(0, 10).map((n) => pitchClassName(n.midi))).toEqual(['Si', 'La', 'Sol♯', 'La', 'Do', 'Ré', 'Do', 'Si', 'Do', 'Mi'])
    const last = notes.filter((n) => n.at === Math.max(...notes.map((x) => x.at)))
    expect(last.every((n) => pitchClassName(n.midi) === 'Mi')).toBe(true)
    const end = Math.max(...notes.map((n) => n.at + n.len)) * unit
    expect(end).toBeGreaterThan(8.5)
    expect(end).toBeLessThan(11)
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

  it('Romance anonyme : mélodie en mi mineur sur arpèges en triolets, qui se pose sur le mi', () => {
    const { notes } = endingFor('guitar')
    const melody = notes.filter((n) => n.midi >= 64)
    expect(melody.slice(0, 6).map((n) => pitchClassName(n.midi))).toEqual(['Si', 'Si', 'Si', 'Si', 'La', 'Sol'])
    expect(pitchClassName(melody[melody.length - 1].midi)).toBe('Mi')
    expect(notes.some((n) => Math.abs(n.at - 1 / 3) < 1e-9)).toBe(true)
    const end = check('guitar')
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
