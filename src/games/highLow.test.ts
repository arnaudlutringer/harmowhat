import { describe, expect, it } from 'vitest'
import { createHighLowQuestion, LEVELS, parseSettings, type Level } from './highLow'
import { INSTRUMENTS } from '@/audio/instruments'
import { A440 } from '@/music/notes'

describe('Grave ou aigu ?', () => {
  it.each(Object.keys(LEVELS) as Level[])('respecte l’écart minimal du niveau %s, dans la tessiture', (level) => {
    for (const inst of Object.values(INSTRUMENTS)) {
      for (let i = 0; i < 200; i++) {
        const n = createHighLowQuestion(level, inst)
        expect(Math.abs(n - A440)).toBeGreaterThanOrEqual(LEVELS[level].minDistance)
        expect(n).toBeGreaterThanOrEqual(inst.low)
        expect(n).toBeLessThanOrEqual(inst.high)
      }
    }
  })

  it('propose des notes graves et aiguës', () => {
    const notes = Array.from({ length: 200 }, () => createHighLowQuestion('debutant', INSTRUMENTS.piano))
    expect(notes.some((n) => n < A440)).toBe(true)
    expect(notes.some((n) => n > A440)).toBe(true)
  })

  it('ignore des réglages invalides', () => {
    expect(parseSettings({ questions: '30', level: 'expert' })).toEqual({ questions: 30, level: 'expert' })
    expect(parseSettings({ questions: '7', level: 'toto' })).toEqual({ questions: 20, level: 'normal' })
  })
})
