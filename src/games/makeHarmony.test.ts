import { describe, expect, it } from 'vitest'
import { spellWithLetter, vexAccidental, vexKeyOf } from '@/music/spelling'
import { INTERVALS } from './intervals'
import { createQuestion, intervalLabel, LEVELS, parseSettings, pitchLabel, type Level } from './makeHarmony'
import { stepRange } from './readNote'

const mod = (n: number, m: number) => ((n % m) + m) % m
const steps = (n: { midi: number; letter: number; alter: number }) => n.letter + 7 * (Math.floor((n.midi - n.alter) / 12) - 1)

describe('Fais l’harmonie', () => {
  it('nomme les intervalles et les notes, doubles altérations comprises', () => {
    const fifth = INTERVALS.find((i) => i.semitones === 7)!
    const majorSeventh = INTERVALS.find((i) => i.semitones === 11)!
    expect(intervalLabel(fifth)).toBe('quinte juste')
    expect(intervalLabel(majorSeventh)).toBe('septième majeure')
    // Septième majeure ascendante du Ré♯ (63) : Do double dièse, qui sonne comme Ré.
    const target = spellWithLetter(63 + 11, 0, 2)!
    expect(pitchLabel(target)).toBe('Do double dièse')
    expect(mod(target.midi, 12)).toBe(2)
    expect(vexKeyOf(target)).toBe('c##/5')
    expect(vexAccidental(target)).toBe('##')
    expect(pitchLabel({ midi: 69 - 2, letter: 5, alter: -2 })).toBe('La double bémol')
    // Les autres jeux gardent leur règle : pas de double altération.
    expect(spellWithLetter(63 + 11, 0)).toBeNull()
  })

  it.each(Object.keys(LEVELS) as Level[])('%s : questions bien formées, dans les règles du niveau', (level) => {
    const cfg = LEVELS[level]
    for (let k = 0; k < 1000; k++) {
      const q = createQuestion(level)
      const { base, target, interval } = q
      expect(cfg.semitones).toContain(interval.semitones)
      expect(cfg.clefs).toContain(q.clef)
      if (!cfg.alterations) expect(base.alter).toBe(0)
      if (!cfg.directions) expect(q.ascending).toBe(true)
      // Bon écart en demi-tons, bonne lettre (le numéro de l'intervalle), réponse = classe de la note cherchée.
      expect(target.midi - base.midi).toBe(q.ascending ? interval.semitones : -interval.semitones)
      expect(steps(target) - steps(base)).toBe(q.ascending ? interval.number - 1 : 1 - interval.number)
      expect(q.answer).toBe(mod(target.midi, 12))
      expect(Math.abs(target.alter)).toBeLessThanOrEqual(2)
      // Les deux notes tiennent sur la portée, à deux lignes supplémentaires au plus.
      const { low, high } = stepRange(q.clef, 2)
      for (const n of [base, target]) {
        expect(steps(n)).toBeGreaterThanOrEqual(low)
        expect(steps(n)).toBeLessThanOrEqual(high)
      }
      expect(q.prompt).toBe(`Quelle note est la ${intervalLabel(interval)} ${q.ascending ? 'ascendante' : 'descendante'} du ${pitchLabel(base)} ?`)
    }
  })

  it('lit les réglages avec repli sur les valeurs par défaut', () => {
    expect(parseSettings({ questions: '30', level: 'expert' })).toEqual({ questions: 30, level: 'expert' })
    expect(parseSettings({ questions: '7', level: 'x' })).toEqual({ questions: 20, level: 'debutant' })
  })
})
