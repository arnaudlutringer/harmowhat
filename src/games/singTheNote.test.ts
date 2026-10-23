import { describe, expect, it } from 'vitest'
import { createQuestion, HeldNote, judge, parseSettings, STABLE_READINGS } from './singTheNote'
import { isBlackKey } from '@/music/spelling'

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

describe('Chante la note', () => {
  it('en débutant, ne demande que des notes naturelles, jamais deux fois de suite la même', () => {
    let previous = createQuestion('debutant')
    for (let i = 0; i < 200; i++) {
      const q = createQuestion('debutant', previous)
      expect(isBlackKey(q.pitchClass)).toBe(false)
      expect(q.pitchClass).not.toBe(previous.pitchClass)
      previous = q
    }
  })

  it('juge à l’octave près, selon la justesse du niveau', () => {
    const mi = { pitchClass: 4, name: 'Mi' }
    // Mi2 (voix grave) et Mi4 (voix aiguë) sont justes.
    expect(judge(hz(40), mi, 'expert')).toEqual({ sung: 40, cents: 0, correct: true })
    expect(judge(hz(64), mi, 'expert').correct).toBe(true)
    // 25 cents trop haut : juste en normal, faux en expert.
    expect(judge(hz(64.25), mi, 'normal')).toMatchObject({ cents: 25, correct: true })
    expect(judge(hz(64.25), mi, 'expert').correct).toBe(false)
    // Un Fa : faux à tous les niveaux.
    expect(judge(hz(65), mi, 'debutant')).toMatchObject({ sung: 65, cents: 100, correct: false })
  })

  it('attend une note tenue avant de juger', () => {
    const held = new HeldNote()
    const reading = (midi: number) => ({ frequency: hz(midi), clarity: 0.95 })
    for (let i = 0; i < STABLE_READINGS - 1; i++) expect(held.push(reading(64 + (i % 2) * 0.1))).toBeNull()
    // Un silence fait recommencer.
    expect(held.push(null)).toBeNull()
    expect(held.progress).toBe(0)
    // Une note qui glisse ne compte pas : seules les dernières mesures, proches, s'accordent.
    for (let i = 0; i < 5; i++) held.push(reading(60 + i))
    let found: number | null = null
    for (let i = 0; i < STABLE_READINGS && found === null; i++) found = held.push(reading(64.1))
    expect(found).not.toBeNull()
    expect(judge(found!, { pitchClass: 4, name: 'Mi' }, 'normal')).toMatchObject({ cents: 10, correct: true })
  })

  it('ignore des réglages invalides', () => {
    expect(parseSettings({ questions: '20', level: 'expert' })).toEqual({ questions: 20, level: 'expert' })
    expect(parseSettings({ questions: '7', level: 'toto' })).toEqual({ questions: 10, level: 'normal' })
  })
})
