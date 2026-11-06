import { describe, expect, it } from 'vitest'
import { NoteStream, notePoints, parseSightSettings, notesForMedal, SAY_LEVELS, SungNotes, tempoAfter } from './sightReading'

describe('Lecture en défilement', () => {
  it('accélère à chaque note lue, sans dépasser 200, et paie dix fois le tempo', () => {
    expect(tempoAfter('debutant', 0)).toBe(30)
    expect(tempoAfter('debutant', 5)).toBe(40)
    expect(tempoAfter('expert', 1000)).toBe(200)
    // « Lecture continue » : +1 à chaque note, à tous les niveaux.
    for (const level of ['debutant', 'normal', 'expert'] as const) expect(SAY_LEVELS[level].step).toBe(1)
    expect(tempoAfter('normal', 5, undefined, SAY_LEVELS.normal.step)).toBe(41)
    // Médaille (10 000 points) : 22 notes en Normal à +1, 19 à +2.
    expect(notesForMedal('normal', SAY_LEVELS)).toBe(22)
    expect(notesForMedal('normal')).toBe(19)
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
    // « Lecture continue » : aucune altération, à tous les niveaux, et la clé change toujours.
    for (const level of ['normal', 'expert'] as const) {
      const said = new NoteStream(level, SAY_LEVELS[level].accidentals)
      const list = Array.from({ length: 100 }, () => said.next())
      expect(list.every((n) => n.note.alter === 0)).toBe(true)
      expect(new Set(list.map((n) => n.clef)).size).toBeGreaterThan(1)
    }
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
