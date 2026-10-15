import { describe, expect, it } from 'vitest'
import { allAnswers, createIntervalQuestion, INTERVALS, intervalName, LEVELS, parseSettings, type Level, type Precision } from './intervals'
import { INSTRUMENTS } from '@/audio/instruments'

const LETTER_PC = [0, 2, 4, 5, 7, 9, 11]

describe('Les harmonies', () => {
  const cases = (Object.keys(LEVELS) as Level[]).flatMap((level) => (['simple', 'precise'] as Precision[]).map((precision) => ({ level, precision })))

  it.each(cases)('niveau $level, précision $precision', ({ level, precision }) => {
    const cfg = LEVELS[level]
    for (let i = 0; i < 300; i++) {
      const q = createIntervalQuestion({ questions: 20, level, precision }, INSTRUMENTS.piano)
      const [a, b] = q.notes
      // Les notes sonnent bien à l'intervalle annoncé, dans le bon sens.
      expect(b.midi - a.midi).toBe(q.ascending ? q.interval.semitones : -q.interval.semitones)
      expect(cfg.semitones).toContain(q.interval.semitones)
      if (!cfg.directions) expect(q.ascending).toBe(true)
      // Écriture juste : l'écart de lettres correspond au numéro de l'intervalle, sans double altération.
      const [lo, hi] = q.ascending ? [a, b] : [b, a]
      expect((hi.letter - lo.letter + 7) % 7).toBe((q.interval.number - 1) % 7)
      for (const n of q.notes) expect(((n.midi - LETTER_PC[n.letter] - n.alter) % 12 + 12) % 12).toBe(0)
      // Propositions : le bon nombre, sans doublon, avec la bonne réponse.
      expect(q.choices).toHaveLength(cfg.choices[precision])
      expect(new Set(q.choices.map((c) => c.id)).size).toBe(q.choices.length)
      expect(new Set(q.choices.map((c) => `${c.label}${c.direction ?? ''}`)).size).toBe(q.choices.length)
      expect(q.choices).toContainEqual(q.answer)
      if (precision === 'simple') expect(q.interval.quality).not.toBe('augmentée')
      expect(q.answer.direction).toBe(cfg.directions ? (q.ascending ? 'up' : 'down') : undefined)
    }
  })

  it('nomme les intervalles', () => {
    const byS = (s: number) => INTERVALS.find((i) => i.semitones === s)!
    expect(intervalName(byS(3), 'precise')).toBe('Tierce mineure')
    expect(intervalName(byS(6), 'precise')).toBe('Quarte augmentée')
    expect(intervalName(byS(9), 'simple')).toBe('Sixte')
    expect(intervalName(byS(12), 'precise')).toBe('Octave')
  })

  it('a assez de réponses possibles pour chaque niveau', () => {
    for (const level of Object.keys(LEVELS) as Level[])
      for (const precision of ['simple', 'precise'] as Precision[])
        expect(allAnswers(level, precision).length).toBeGreaterThanOrEqual(LEVELS[level].choices[precision])
  })

  it('ignore des réglages invalides', () => {
    expect(parseSettings({ questions: '10', level: 'expert', precision: 'simple' })).toEqual({ questions: 10, level: 'expert', precision: 'simple' })
    expect(parseSettings({ questions: 'x', level: 'x', precision: 'x' })).toEqual({ questions: 20, level: 'normal', precision: 'precise' })
  })
})
