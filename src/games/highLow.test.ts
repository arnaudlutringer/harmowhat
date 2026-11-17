import { describe, expect, it } from 'vitest'
import { createHighLowQuestion, LEVELS, parseSettings, REFERENCE_RANGE, type Level } from './highLow'
import { INSTRUMENTS } from '@/audio/instruments'
import { A440 } from '@/music/notes'

describe('Grave ou aigu ?', () => {
  it.each(Object.keys(LEVELS) as Level[])('respecte les écarts du niveau %s, dans la tessiture', (level) => {
    const { minDistance, maxDistance = Infinity } = LEVELS[level]
    for (const inst of Object.values(INSTRUMENTS)) {
      for (let i = 0; i < 200; i++) {
        const { reference, note } = createHighLowQuestion(level, inst)
        const gap = Math.abs(note - reference)
        expect(gap).toBeGreaterThanOrEqual(minDistance)
        expect(gap).toBeLessThanOrEqual(maxDistance)
        for (const n of [reference, note]) {
          expect(n).toBeGreaterThanOrEqual(inst.low)
          expect(n).toBeLessThanOrEqual(inst.high)
        }
      }
    }
  })

  it('garde le La3 comme référence en débutant et en normal, une note au hasard en expert et en Impossible', () => {
    for (const level of ['debutant', 'normal'] as const) expect(createHighLowQuestion(level, INSTRUMENTS.piano).reference).toBe(A440)
    for (const level of ['expert', 'impossible'] as const) {
      const refs = new Set(Array.from({ length: 200 }, () => createHighLowQuestion(level, INSTRUMENTS.piano).reference))
      expect(refs.size).toBeGreaterThan(10)
      for (const r of refs) {
        expect(r).toBeGreaterThanOrEqual(REFERENCE_RANGE.low)
        expect(r).toBeLessThanOrEqual(REFERENCE_RANGE.high)
      }
    }
  })

  it('le quart de ton est le plus petit écart, seulement en Impossible', () => {
    const gaps = Array.from({ length: 100 }, () => {
      const q = createHighLowQuestion('impossible', INSTRUMENTS.piano)
      return Math.abs(q.note - q.reference)
    })
    expect(new Set(gaps)).toEqual(new Set([0.5]))
    expect(Math.min(...Object.values(LEVELS).map((l) => l.minDistance))).toBe(0.5)
  })

  it('propose des notes graves et aiguës', () => {
    for (const level of Object.keys(LEVELS) as Level[]) {
      const qs = Array.from({ length: 200 }, () => createHighLowQuestion(level, INSTRUMENTS.piano))
      expect(qs.some((q) => q.note < q.reference)).toBe(true)
      expect(qs.some((q) => q.note > q.reference)).toBe(true)
    }
  })

  it('ignore des réglages invalides', () => {
    expect(parseSettings({ questions: '30', level: 'expert' })).toEqual({ questions: 30, level: 'expert' })
    expect(parseSettings({ questions: '7', level: 'toto' })).toEqual({ questions: 20, level: 'normal' })
  })
})
