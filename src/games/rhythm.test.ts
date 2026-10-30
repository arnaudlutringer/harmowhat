import { describe, expect, it } from 'vitest'
import { BEATS, CELLS, createRhythmQuestion, judgeTaps, LEVELS, onsets, parseSettings, tapPoints, type Level } from './rhythm'

describe('Jeux de rythme', () => {
  it('chaque cellule remplit exactement un temps', () => {
    for (const c of Object.values(CELLS)) expect(c.parts.reduce((s, d) => s + Math.abs(d), 0)).toBeCloseTo(1)
  })

  it.each(Object.keys(LEVELS) as Level[])('au niveau %s, trois cellules du niveau, la première jouée', (level) => {
    for (let i = 0; i < 200; i++) {
      const q = createRhythmQuestion(level)
      expect(q.cells).toHaveLength(BEATS)
      for (const c of q.cells) expect(LEVELS[level].cells).toContain(c)
      expect(CELLS[q.cells[0]].parts[0]).toBeGreaterThan(0)
    }
  })

  it('calcule les attaques, silences compris', () => {
    expect(onsets(['noire', 'croches', 'soupir'])).toEqual([0, 1, 1.5])
    expect(onsets(['demi-soupir-croche', 'pointee', 'noire']).map((t) => +t.toFixed(2))).toEqual([0.5, 1, 1.75, 2])
  })

  it('juge les frappes : dans la tolérance, ni manquante ni en trop', () => {
    const expected = [0, 0.5, 1]
    expect(judgeTaps(expected, [0.02, 0.48, 1.05], 0.1).correct).toBe(true)
    // Une frappe trop tard.
    expect(judgeTaps(expected, [0.02, 0.65, 1], 0.1).correct).toBe(false)
    // Une frappe manquante, une en trop.
    expect(judgeTaps(expected, [0, 1], 0.1).correct).toBe(false)
    expect(judgeTaps(expected, [0, 0.5, 1, 1.3], 0.1)).toMatchObject({ correct: false, extra: [1.3] })
  })

  it('donne les points selon la précision', () => {
    const perfect = judgeTaps([0, 1], [0.01, 1.005], 0.1)
    expect(tapPoints(perfect, 0.1)).toBe(10000)
    const loose = judgeTaps([0, 1], [0.09, 1.09], 0.1)
    expect(tapPoints(loose, 0.1)).toBeLessThan(2000)
    expect(tapPoints(judgeTaps([0, 1], [0.5], 0.1), 0.1)).toBe(0)
  })

  it('ignore des réglages invalides', () => {
    expect(parseSettings({ questions: '5', level: 'expert' })).toEqual({ questions: 5, level: 'expert' })
    expect(parseSettings({ questions: '7', level: 'x' })).toEqual({ questions: 10, level: 'normal' })
  })
})
