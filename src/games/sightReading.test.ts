import { describe, expect, it } from 'vitest'
import { NoteStream, notePoints, parseSightSettings, parseSpokenNotes, setLearnedWords, SungNotes, tempoAfter } from './sightReading'

describe('Lecture en défilement', () => {
  it('reconnaît les noms de notes dits, avec leurs altérations et quelques homophones', () => {
    expect(parseSpokenNotes('Do ré mi').map((n) => n.pc)).toEqual([0, 2, 4])
    expect(parseSpokenNotes('fa dièse, si bémol').map((n) => n.pc)).toEqual([6, 10])
    expect(parseSpokenNotes('Sol').map((n) => n.altered)).toEqual([false])
    expect(parseSpokenNotes('scie six seul là').map((n) => n.pc)).toEqual([11, 11, 7, 9])
    expect(parseSpokenNotes('do bémol')[0]).toEqual({ pc: 11, altered: true })
    expect(parseSpokenNotes('euh bonjour')).toEqual([])
    expect(parseSpokenNotes('Arrêt').map((n) => n.pc)).toEqual([2])
    // Notes collées en un mot par la reconnaissance vocale.
    expect(parseSpokenNotes('doré solla').map((n) => n.pc)).toEqual([0, 2, 7, 9])
    expect(parseSpokenNotes('fadièse rémi').map((n) => n.pc)).toEqual([6, 2, 4])
  })

  it('comprend les transcriptions apprises de la voix du joueur', () => {
    expect(parseSpokenNotes('les')).toEqual([])
    setLearnedWords({ re: ['les'], diese: ['des yeux'] })
    expect(parseSpokenNotes('Les').map((n) => n.pc)).toEqual([2])
    expect(parseSpokenNotes('fa des yeux, les')).toEqual([{ pc: 6, altered: true }, { pc: 2, altered: false }])
    setLearnedWords({})
    expect(parseSpokenNotes('les')).toEqual([])
  })

  it('accélère à chaque note lue, sans dépasser 200, et paie dix fois le tempo', () => {
    expect(tempoAfter('debutant', 0)).toBe(30)
    expect(tempoAfter('debutant', 5)).toBe(40)
    expect(tempoAfter('expert', 1000)).toBe(200)
    expect(notePoints(54)).toBe(540)
  })

  it('tire des notes sans deux fois le même nom de suite, dans les clés du niveau', () => {
    const stream = new NoteStream('normal')
    let last = -1
    for (let i = 0; i < 200; i++) {
      const n = stream.next()
      expect(n.pc).not.toBe(last)
      expect(['sol', 'fa']).toContain(n.clef)
      last = n.pc
    }
    // La clé change toutes les 8 à 10 notes, pour une autre.
    for (const level of ['normal', 'expert'] as const) {
      const s = new NoteStream(level)
      const clefs = Array.from({ length: 300 }, () => s.next().clef)
      const runs: number[] = []
      let run = 1
      for (let i = 1; i < clefs.length; i++) {
        if (clefs[i] === clefs[i - 1]) run++
        else {
          runs.push(run)
          run = 1
        }
      }
      expect(runs.length).toBeGreaterThan(20)
      for (const r of runs) expect(r).toBeGreaterThanOrEqual(8)
      for (const r of runs) expect(r).toBeLessThanOrEqual(10)
    }
    const easy = new NoteStream('debutant')
    for (let i = 0; i < 50; i++) expect(easy.next().note.alter).toBe(0)
  })

  it('retient une note chantée tenue, une seule fois tant qu’elle dure', () => {
    const sung = new SungNotes()
    const heard: (number | null)[] = []
    for (let i = 0; i < 12; i++) heard.push(sung.push(69.1))
    expect(heard.filter((n) => n !== null)).toEqual([69])
    // Après un silence, la même note compte de nouveau.
    sung.push(null)
    for (let i = 0; i < 5; i++) heard.push(sung.push(68.9))
    expect(heard.filter((n) => n !== null)).toEqual([69, 69])
  })

  it('lit des réglages sûrs', () => {
    expect(parseSightSettings({ level: 'expert', questions: '20' })).toEqual({ level: 'expert', questions: 1 })
    expect(parseSightSettings({ level: 'nimporte' }).level).toBe('debutant')
  })
})
