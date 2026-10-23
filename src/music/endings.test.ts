import { describe, expect, it } from 'vitest'
import { endingFor, endingsFor, ENDINGS, firstSeconds, INSTRUMENT_ENDINGS } from './endings'
import { INSTRUMENTS, type InstrumentId } from '@/audio/instruments'
import { pitchClassName } from './notes'

describe('Musique de fin', () => {
  it('joue le Printemps au violon, les Patineurs à l’accordéon, Bella ciao à la clarinette, Slow Piano Blues au piano', () => {
    expect(endingFor('violin').title).toBe('Le Printemps')
    expect(endingFor('accordion').title).toBe('Les Patineurs')
    expect(endingFor('clarinet').title).toBe('Rhapsody in Blue')
    expect(endingFor('guitar').title).toBe('Romance (Jeux interdits)')
    expect(endingFor('piano').title).toBe('Slow Piano Blues')
    expect(endingFor('cello').title).toBe('Prélude de la Suite n° 1')
  })

  it('ne joue que les 10 premières secondes de chaque morceau', () => {
    for (const e of Object.values(ENDINGS).filter((e) => !e.recording)) {
      const end = Math.max(...e.notes.map((n) => n.at + n.len)) * e.unit
      expect(end).toBeLessThanOrEqual(10 + 1e-9)
      // Une phrase complète peut finir avant (ex. l'appel de Rhapsody in Blue, la Danse macabre).
      expect(end).toBeGreaterThan(5)
    }
    expect(firstSeconds([{ midi: 60, at: 0, len: 4 }, { midi: 62, at: 5, len: 1 }], 2.5)).toEqual([{ midi: 60, at: 0, len: 4 }])
    expect(firstSeconds([{ midi: 60, at: 3, len: 4 }], 2.5)).toEqual([{ midi: 60, at: 3, len: 1 }])
  })

  it('chaque morceau reste dans la tessiture de son instrument', () => {
    for (const id of Object.keys(INSTRUMENTS) as InstrumentId[])
      for (const e of endingsFor(id))
        for (const n of e.notes) {
          expect(n.midi, `${e.title} (${id})`).toBeGreaterThanOrEqual(INSTRUMENTS[id].low)
          expect(n.midi, `${e.title} (${id})`).toBeLessThanOrEqual(INSTRUMENTS[id].high)
        }
  })

  it('violoncelle, trompette et accordéon proposent chacun plusieurs morceaux', () => {
    expect(INSTRUMENT_ENDINGS.cello).toEqual(['bach-prelude', 'swan', 'dvorak', 'hedwig'])
    expect(INSTRUMENT_ENDINGS.trumpet).toEqual(['te-deum', 'taps'])
    expect(INSTRUMENT_ENDINGS.accordion).toEqual(['skaters', 'over-the-waves', 'blue-danube', 'valse-musette'])
  })

  it('premières notes des nouveaux morceaux', () => {
    // La mélodie se distingue de l'accompagnement par son volume.
    const first = (id: keyof typeof ENDINGS, count: number) =>
      ENDINGS[id].notes.filter((n) => (n.velocity ?? 1) >= 0.4).slice(0, count).map((n) => pitchClassName(n.midi))
    expect(first('swan', 6)).toEqual(['Sol', 'Fa♯', 'Si', 'Mi', 'Ré', 'Sol'])
    expect(first('dvorak', 4)).toEqual(['Si', 'Do♯', 'Ré', 'Si'])
    // Hedwig's Theme : levée si mi sol, fa♯ mi si la… et la phrase se pose sur le si grave.
    expect(first('hedwig', 7)).toEqual(['Si', 'Mi', 'Sol', 'Fa♯', 'Mi', 'Si', 'La'])
    expect(ENDINGS.hedwig.notes[ENDINGS.hedwig.notes.length - 1].midi).toBe(47)
    expect(first('te-deum', 6)).toEqual(['La', 'Ré', 'Ré', 'Mi', 'Fa♯', 'Ré'])
    expect(first('over-the-waves', 4)).toEqual(['Si', 'La♯', 'Si', 'Ré'])
    expect(first('blue-danube', 4)).toEqual(['Ré', 'Ré', 'Fa♯', 'La'])
    // Une valse musette : levée do mi sol do, si tenu, puis do mi sol si, la tenu ; la phrase se pose sur le la de « muguet ».
    expect(first('valse-musette', 10)).toEqual(['Do', 'Mi', 'Sol', 'Do', 'Si', 'Do', 'Mi', 'Sol', 'Si', 'La'])
    const musette = ENDINGS['valse-musette'].notes.filter((n) => (n.velocity ?? 1) >= 0.4)
    expect(pitchClassName(musette[musette.length - 1].midi)).toBe('La')
    expect(first('morning', 6)).toEqual(['Si', 'Sol♯', 'Fa♯', 'Mi', 'Fa♯', 'Sol♯'])
    expect(first('faune', 7)).toEqual(['Do♯', 'Do', 'Si', 'La♯', 'La', 'Sol♯', 'Sol'])
    expect(first('badinerie', 6)).toEqual(['Si', 'Ré', 'Si', 'Fa♯', 'Si', 'Fa♯'])
    expect(INSTRUMENT_ENDINGS.flute).toEqual(['morning', 'faune', 'badinerie'])
    expect(first('rising-sun', 6)).toEqual(['La', 'Ré', 'Mi', 'Ré', 'Fa', 'Sol'])
    expect(first('paganini-24', 6)).toEqual(['La', 'La', 'La', 'Do', 'Si', 'La'])
    expect(first('mountain-king', 7)).toEqual(['Si', 'Do♯', 'Ré', 'Mi', 'Fa♯', 'Ré', 'Fa♯'])
    expect(INSTRUMENT_ENDINGS['electric-guitar']).toEqual(['rising-sun', 'paganini-24', 'mountain-king'])
    expect(first('mendelssohn', 5)).toEqual(['Si', 'Si', 'Si', 'Sol', 'Mi'])
    // Danse macabre : la et mi♭ (triton) ensemble, puis ré et la.
    expect(first('danse-macabre', 4)).toEqual(['La', 'Ré♯', 'Ré', 'La'])
    expect(INSTRUMENT_ENDINGS.violin).toEqual(['spring', 'mendelssohn', 'danse-macabre'])
    expect(first('hava-nagila', 5)).toEqual(['Ré', 'Ré', 'Fa♯', 'Ré♯', 'Ré'])
    // Rhapsody in Blue : trille fa–sol, puis la montée jusqu'au si♭ aigu.
    expect(first('rhapsody', 2)).toEqual(['Fa', 'Sol'])
    expect(pitchClassName(ENDINGS.rhapsody.notes[ENDINGS.rhapsody.notes.length - 1].midi)).toBe('La♯')
    expect(INSTRUMENT_ENDINGS.clarinet).toEqual(['rhapsody', 'hava-nagila', 'bella-ciao', 'tico-tico'])
    // Tico-Tico : levée mi ré♯ mi, puis fa mi… la, et la phrase se pose sur le do.
    expect(first('tico-tico', 6)).toEqual(['Mi', 'Ré♯', 'Mi', 'Fa', 'Mi', 'La'])
    expect(pitchClassName(ENDINGS['tico-tico'].notes[ENDINGS['tico-tico'].notes.length - 1].midi)).toBe('Do')
    expect(first('greensleeves', 6)).toEqual(['Sol', 'La♯', 'Do', 'Ré', 'Ré♯', 'Ré'])
    expect(first('gran-vals', 4)).toEqual(['Ré', 'Mi', 'Mi', 'Fa♯'])
    expect(first('asturias', 8)).toEqual(['Mi', 'Si', 'Si', 'Si', 'Do', 'Si', 'La', 'Si'])
    expect(INSTRUMENT_ENDINGS.guitar).toEqual(['romance', 'gran-vals', 'greensleeves', 'asturias'])
  })

  it('Taps à la trompette : sol sol do, sol do mi, dans les 10 premières secondes', () => {
    const { notes } = ENDINGS.taps
    expect(notes.map((n) => pitchClassName(n.midi))).toEqual(['Sol', 'Sol', 'Do', 'Sol', 'Do', 'Mi'])
    for (const n of notes) {
      expect(n.midi).toBeGreaterThanOrEqual(INSTRUMENTS.trumpet.low)
      expect(n.midi).toBeLessThanOrEqual(INSTRUMENTS.trumpet.high)
    }
  })

  it('Prélude de Bach : sol ré si la si ré si ré, sur la corde de sol à vide', () => {
    const { notes } = ENDINGS['bach-prelude']
    expect(notes.slice(0, 8).map((n) => pitchClassName(n.midi))).toEqual(['Sol', 'Ré', 'Si', 'La', 'Si', 'Ré', 'Si', 'Ré'])
    expect(notes[0].midi).toBe(INSTRUMENTS.cello.low + 7)
  })

  it('propose plusieurs morceaux au piano et joue celui choisi, s’il est proposé pour l’instrument', () => {
    expect(endingsFor('piano').map((e) => e.title)).toEqual(['Slow Piano Blues', 'La Lettre à Élise', 'Sonate au clair de lune (3ᵉ mvt)', 'Marche turque'])
    expect(endingFor('piano', { piano: 'moonlight' }).id).toBe('moonlight')
    expect(endingFor('violin', { violin: 'moonlight' }).id).toBe('spring')
    expect(endingFor('piano', {}).id).toBe('blues')
    expect(endingFor('piano', {}).recording).toBe('music/slow-piano-blues.mp3')
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
    const { notes, unit } = ENDINGS['bella-ciao']
    expect(notes.slice(0, 5).map((n) => pitchClassName(n.midi))).toEqual(['Ré', 'Sol', 'La', 'La♯', 'Sol'])
    const end = Math.max(...notes.map((n) => n.at + n.len)) * unit
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
    for (const id of Object.keys(INSTRUMENTS) as InstrumentId[]) {
      const e = endingFor(id)
      if (e.recording) expect(e.recording).toMatch(/\.mp3$/)
      else expect(e.notes.length).toBeGreaterThan(5)
    }
  })
})
