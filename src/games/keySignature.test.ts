import { describe, expect, it } from 'vitest'
import { choicesFor, createQuestion, keyById, KEYS, LEVELS, parseSettings, relativeOf, scaleOf, tonicPc, type Level } from './keySignature'

const label = (id: string) => keyById(id)?.label

describe('La tonalité', () => {
  it('connaît les 15 armures, leurs tonalités majeures et leurs relatives mineures', () => {
    expect(KEYS).toHaveLength(30)
    const byFifths = (fifths: number) => KEYS.filter((k) => k.fifths === fifths).map((k) => k.label)
    expect(byFifths(0)).toEqual(['Do M', 'La m'])
    expect(byFifths(1)).toEqual(['Sol M', 'Mi m'])
    expect(byFifths(-1)).toEqual(['Fa M', 'Ré m'])
    expect(byFifths(-2)).toEqual(['Si♭ M', 'Sol m'])
    expect(byFifths(6)).toEqual(['Fa♯ M', 'Ré♯ m'])
    expect(byFifths(7)).toEqual(['Do♯ M', 'La♯ m'])
    expect(byFifths(-7)).toEqual(['Do♭ M', 'La♭ m'])
    expect(byFifths(-6)).toEqual(['Sol♭ M', 'Mi♭ m'])
    expect(keyById('fa#-M')?.vex).toBe('F#')
    expect(keyById('sol-m')?.vex).toBe('Bb')
    expect(label(relativeOf(keyById('do-M')!).id)).toBe('La m')
  })

  it('joue la gamme : majeure, ou mineure naturelle', () => {
    expect(scaleOf(keyById('do-M')!)).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
    expect(scaleOf(keyById('la-m')!)).toEqual([57, 59, 60, 62, 64, 65, 67, 69])
    expect(scaleOf(keyById('fa#-M')!)[0]).toBe(66)
  })

  it.each(Object.keys(LEVELS) as Level[])('%s : la question précise le mode, les propositions sont toutes de ce mode', (level) => {
    const cfg = LEVELS[level]
    const modes = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const q = createQuestion(level)
      modes.add(q.key.mode)
      expect(cfg.clefs).toContain(q.clef)
      expect(cfg.modes).toContain(q.key.mode)
      expect(q.prompt).toBe(q.key.mode === 'M' ? 'Quelle est la tonalité Majeure ?' : 'Quelle est la tonalité mineure ?')
      for (const c of q.choices) expect(c.mode).toBe(q.key.mode)
      // Une seule proposition a l'armure montrée : la bonne réponse.
      expect(q.choices.filter((c) => c.fifths === q.key.fifths).map((c) => c.id)).toEqual([q.key.id])
      // Pas de doublon enharmonique (Do♭ M et Si M, Fa♯ M et Sol♭ M…).
      expect(new Set(q.choices.map(tonicPc)).size).toBe(q.choices.length)
      // Armure en bémols : aucune tonalité en dièses ; armure en dièses : aucune en bémols.
      if (q.key.fifths < 0) for (const c of q.choices) expect(c.fifths).toBeLessThanOrEqual(0)
      if (q.key.fifths > 0) for (const c of q.choices) expect(c.fifths).toBeGreaterThanOrEqual(0)
    }
    expect([...modes].sort()).toEqual([...cfg.modes].sort())
  })

  it('propose les tonalités du côté de l’armure, dans l’ordre des toniques', () => {
    const labels = (id: string) => choicesFor(keyById(id)!).sort((a, b) => tonicPc(a) - tonicPc(b)).map((k) => k.label)
    expect(labels('sib-M')).toEqual(['Do M', 'Ré♭ M', 'Mi♭ M', 'Fa M', 'Sol♭ M', 'La♭ M', 'Si♭ M', 'Do♭ M'])
    expect(labels('mi-M')).toEqual(['Do M', 'Do♯ M', 'Ré M', 'Mi M', 'Fa♯ M', 'Sol M', 'La M', 'Si M'])
    // Sans altération : une tonalité par note, sous son nom le plus courant.
    expect(labels('do-M')).toEqual(['Do M', 'Ré♭ M', 'Ré M', 'Mi♭ M', 'Mi M', 'Fa M', 'Fa♯ M', 'Sol M', 'La♭ M', 'La M', 'Si♭ M', 'Si M'])
    expect(labels('la-m')).toEqual(['Do m', 'Do♯ m', 'Ré m', 'Mi♭ m', 'Mi m', 'Fa m', 'Fa♯ m', 'Sol m', 'Sol♯ m', 'La m', 'Si♭ m', 'Si m'])
  })

  it('lit les réglages avec repli sur les valeurs par défaut', () => {
    expect(parseSettings({ questions: '50', level: 'normal' })).toEqual({ questions: 50, level: 'normal' })
    expect(parseSettings({})).toEqual({ questions: 20, level: 'debutant' })
  })
})
