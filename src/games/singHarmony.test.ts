import { describe, expect, it } from 'vitest'
import { BASE_HIGH, BASE_LOW, createQuestion, judge, LEVELS, parseSettings, type Level } from './singHarmony'
import { spelledPitchName } from '@/music/spelling'

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

describe('Chante l’harmonie', () => {
  it.each(Object.keys(LEVELS) as Level[])('au niveau %s, part de l’octave 3 et écrit juste la note attendue', (level) => {
    for (let i = 0; i < 300; i++) {
      const q = createQuestion(level)
      expect(q.base.midi).toBeGreaterThanOrEqual(BASE_LOW)
      expect(q.base.midi).toBeLessThanOrEqual(BASE_HIGH)
      expect(LEVELS[level].semitones).toContain(q.interval.semitones)
      expect(q.target.midi - q.base.midi).toBe((q.ascending ? 1 : -1) * q.interval.semitones)
      // L'écriture suit le numéro de l'intervalle : une quarte part de Do vers Fa (jamais Mi♯).
      const letters = (((q.target.letter - q.base.letter) * (q.ascending ? 1 : -1)) % 7 + 7) % 7
      expect(letters).toBe((q.interval.number - 1) % 7)
      if (!LEVELS[level].descending) expect(q.ascending).toBe(true)
    }
  })

  it('en débutant, ne demande que tierce majeure, quarte, quinte et octave', () => {
    const asked = new Set(Array.from({ length: 300 }, () => createQuestion('debutant').label))
    expect([...asked].sort()).toEqual(
      ["l'octave ascendante", 'la quarte juste ascendante', 'la quinte juste ascendante', 'la tierce majeure ascendante'],
    )
  })

  it('en expert, demande aussi des intervalles descendants', () => {
    expect(Array.from({ length: 100 }, () => createQuestion('expert')).some((q) => !q.ascending)).toBe(true)
  })

  it('juge la note chantée à l’octave près, et la place près de la note attendue', () => {
    const q = createQuestion('debutant')
    expect(judge(hz(q.target.midi - 12), q)).toMatchObject({ cents: 0, correct: true, sung: q.target })
    const wrong = judge(hz(q.target.midi + 1), q)
    expect(wrong).toMatchObject({ cents: 100, correct: false })
    expect(wrong.sung.midi).toBe(q.target.midi + 1)
    expect(spelledPitchName(wrong.sung)).not.toBe(spelledPitchName(q.target))
  })

  it('ignore des réglages invalides', () => {
    expect(parseSettings({ questions: '5', level: 'expert' })).toEqual({ questions: 5, level: 'expert' })
    expect(parseSettings({ questions: '7', level: 'toto' })).toEqual({ questions: 10, level: 'normal' })
  })
})
