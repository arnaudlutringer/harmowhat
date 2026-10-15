import { describe, expect, it } from 'vitest'
import { createQuestion, LEVELS, parseSettings, type Level } from './nameTheNote'


const BASE: Record<string, number> = { Do: 0, Ré: 2, Mi: 4, Fa: 5, Sol: 7, La: 9, Si: 11 }
function pitchClass(name: string): number {
  const letter = name.replace(/[♯♭]/, '')
  return (BASE[letter] + (name.endsWith('♯') ? 1 : name.endsWith('♭') ? -1 : 0) + 12) % 12
}

describe('Quelle est la note ?', () => {
  it('propose des bémols', () => {
    const names = Array.from({ length: 300 }, () => createQuestion('expert').choices).flat()
    expect(names.some((n) => n.endsWith('♭'))).toBe(true)
    expect(names.some((n) => n.endsWith('♯'))).toBe(true)
  })

  it.each(Object.keys(LEVELS) as Level[])('respecte le niveau %s', (level) => {
    const cfg = LEVELS[level]
    for (let i = 0; i < 300; i++) {
      const q = createQuestion(level)
      expect(q.midi).toBeGreaterThanOrEqual(cfg.low)
      expect(q.midi).toBeLessThanOrEqual(cfg.high)
      expect(pitchClass(q.answer)).toBe(q.midi % 12)
      expect(q.fullName.startsWith(q.answer)).toBe(true)
      // Aucun doublon enharmonique (La♯ et Si♭ ensemble).
      expect(new Set(q.choices.map(pitchClass)).size).toBe(cfg.choices)
      expect(q.choices).toHaveLength(cfg.choices)
      expect(new Set(q.choices).size).toBe(cfg.choices)
      expect(q.choices).toContain(q.answer)
      if (cfg.naturalsOnly) expect(q.choices.some((c) => /[♯♭]/.test(c))).toBe(false)
      // Dans l'ordre de la gamme, de Do à Si.
      const pcs = q.choices.map(pitchClass)
      expect(pcs).toEqual([...pcs].sort((a, b) => a - b))
    }
  })

  it('ignore des réglages invalides', () => {
    expect(parseSettings({ questions: '30', level: 'expert' })).toEqual({ questions: 30, level: 'expert' })
    expect(parseSettings({ questions: '7', level: 'toto' })).toEqual({ questions: 20, level: 'normal' })
  })
})
