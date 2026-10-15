import { describe, expect, it } from 'vitest'
import { spelledName } from '@/music/spelling'
import { CHOICES, CLEFS, createQuestion, LEVELS, noteAt, parseSettings, stepRange, type Level } from './readNote'

describe('Lecture de note', () => {
  it('place les clés au bon endroit', () => {
    // Ligne du milieu de la clé de sol : Si3 ; de la clé de fa : Ré2.
    expect(spelledName(noteAt(CLEFS.sol.bottomLine + 4, 0))).toBe('Si3')
    expect(spelledName(noteAt(CLEFS.fa.bottomLine + 4, 0))).toBe('Ré2')
    // Le Do3 (Do central) est sur la ligne de la clé d'ut : 1re, 3e ou 4e ligne.
    expect(noteAt(CLEFS.ut1.bottomLine, 0).midi).toBe(60)
    expect(noteAt(CLEFS.ut3.bottomLine + 4, 0).midi).toBe(60)
    expect(noteAt(CLEFS.ut4.bottomLine + 6, 0).midi).toBe(60)
    // La clé de fa est sur la 4e ligne.
    expect(spelledName(noteAt(CLEFS.fa.bottomLine + 6, 0))).toBe('Fa2')
  })

  it('écrit les altérations', () => {
    expect(spelledName(noteAt(CLEFS.sol.bottomLine + 4, -1))).toBe('Si♭3')
    expect(noteAt(CLEFS.sol.bottomLine + 4, -1).midi).toBe(70)
    expect(spelledName(noteAt(CLEFS.fa.bottomLine, 1))).toBe('Sol♯1')
  })

  it('propose les 12 notes, de Do à Si', () => {
    expect(CHOICES.map((c) => c.pc)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(CHOICES[0].label).toBe('Do')
    expect(CHOICES[1].label).toBe('Do♯ / Ré♭')
    expect(CHOICES[10].label).toBe('La♯ / Si♭')
    expect(CHOICES[11].label).toBe('Si')
  })

  it.each(Object.keys(LEVELS) as Level[])('respecte le niveau %s', (level) => {
    const cfg = LEVELS[level]
    const clefs = new Set<string>()
    let altered = false
    for (let i = 0; i < 500; i++) {
      const q = createQuestion(level)
      clefs.add(q.clef)
      expect(cfg.clefs).toContain(q.clef)
      const { low, high } = stepRange(q.clef, cfg.ledgerLines)
      const step = q.note.letter + 7 * Math.floor((q.note.midi - q.note.alter) / 12 - 1)
      expect(step).toBeGreaterThanOrEqual(low)
      expect(step).toBeLessThanOrEqual(high)
      expect(q.answer).toBe(q.note.midi % 12)
      if (q.note.alter !== 0) {
        altered = true
        // Toujours une touche noire : ni Mi♯, ni Fa♭, ni Si♯, ni Do♭.
        expect([1, 3, 6, 8, 10]).toContain(q.answer)
      }
      expect(CHOICES.some((c) => c.pc === q.answer && c.label.includes(q.fullName.replace(/-?\d+$/, '')))).toBe(true)
    }
    expect([...clefs].sort()).toEqual([...cfg.clefs].sort())
    expect(altered).toBe(true)
  })

  it('ignore des réglages invalides', () => {
    expect(parseSettings({ questions: '30', level: 'expert' })).toEqual({ questions: 30, level: 'expert' })
    expect(parseSettings({ questions: '7', level: 'toto' })).toEqual({ questions: 20, level: 'debutant' })
  })
})
