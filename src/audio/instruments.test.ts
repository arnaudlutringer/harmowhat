import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fitToRange, INSTRUMENTS, nearestSample, parseInstrument, randomInstrumentNote, sampleMidis } from './instruments'
import { createQuestion, levelRange, LEVELS, type Level } from '@/games/nameTheNote'
import { createChordQuestion } from '@/games/chords'

const all = Object.values(INSTRUMENTS)

describe('Instruments', () => {
  it.each(all)('$label : un échantillon à un demi-ton au plus de chaque note', (inst) => {
    for (const s of sampleMidis(inst)) {
      expect(existsSync(new URL(`../../public/samples/${inst.id}/${s}.mp3`, import.meta.url))).toBe(true)
    }
    for (let m = inst.low; m <= inst.high; m++) expect(Math.abs(nearestSample(inst, m) - m)).toBeLessThanOrEqual(1)
  })

  it.each(all)('$label : les questions restent dans la tessiture', (inst) => {
    for (let i = 0; i < 200; i++) {
      const n = randomInstrumentNote(inst, [69])
      expect(n).not.toBe(69)
      expect(n).toBeGreaterThanOrEqual(inst.low)
      expect(n).toBeLessThanOrEqual(inst.high)
      for (const level of Object.keys(LEVELS) as Level[]) {
        const { midi } = createQuestion(level, inst)
        const { low, high } = levelRange(level, inst)
        expect(midi).toBeGreaterThanOrEqual(Math.max(low, inst.low))
        expect(midi).toBeLessThanOrEqual(Math.min(high, inst.high))
      }
      for (const level of ['debutant', 'normal', 'expert'] as const)
        for (const n of createChordQuestion(level, inst).choices) {
          expect(n).toBeGreaterThanOrEqual(inst.low)
          expect(n).toBeLessThanOrEqual(inst.high)
        }
    }
  })

  it('ramène une note hors tessiture à l’octave près', () => {
    expect(fitToRange(INSTRUMENTS.violin, 45)).toBe(57)
    expect(fitToRange(INSTRUMENTS.cello, 88)).toBe(76)
    expect(fitToRange(INSTRUMENTS.piano, 45)).toBe(45)
  })

  it('ignore un instrument inconnu', () => {
    expect(parseInstrument('violin')).toBe('violin')
    expect(parseInstrument('banjo')).toBe('piano')
    expect(parseInstrument(null)).toBe('piano')
  })
})
