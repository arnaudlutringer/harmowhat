import { describe, expect, it } from 'vitest'
import {
  CHOICE_GAP, createFindQuestion, FIND_LEVELS, isTempoClose, judgeBeat, parseFindSettings, parseKeepSettings, stageBeats, stageTempo,
  tempoName,
} from './tempo'
import { onsets } from './rhythm'

describe('Garde le tempo', () => {
  it('débutant : 60, puis 70, 80… ; normal et expert : au hasard dans leur plage', () => {
    expect([0, 1, 2].map((i) => stageTempo('debutant', i))).toEqual([60, 70, 80])
    for (let i = 0; i < 200; i++) {
      const n = stageTempo('normal', i)
      const e = stageTempo('expert', i)
      expect(n).toBeGreaterThanOrEqual(50)
      expect(n).toBeLessThanOrEqual(120)
      expect(e).toBeGreaterThanOrEqual(40)
      expect(e).toBeLessThanOrEqual(160)
    }
  })

  it('un palier dure 30 secondes', () => {
    expect(stageBeats(60)).toBe(30)
    expect(stageBeats(120)).toBe(60)
  })

  it('une frappe compte sur le temps le plus proche, une seule fois, dans la tolérance', () => {
    const done = new Set<number>()
    expect(judgeBeat(1.04, 1, 0.1, done)).toMatchObject({ index: 1, ok: true })
    expect(judgeBeat(1.5, 1, 0.1, done).ok).toBe(false)
    done.add(1)
    expect(judgeBeat(0.98, 1, 0.1, done).ok).toBe(false)
  })


  it('réglages : pas de nombre de questions, débutant par défaut', () => {
    expect(parseKeepSettings({ level: 'toto', questions: '20' })).toEqual({ questions: 1, level: 'debutant' })
  })
})

describe('Trouve le tempo', () => {
  it('débutant : un tempo rond et 4 propositions bien différentes', () => {
    for (let i = 0; i < 300; i++) {
      const q = createFindQuestion('debutant')
      expect(q.tempo % 10).toBe(0)
      expect(q.tempo).toBeGreaterThanOrEqual(50)
      expect(q.tempo).toBeLessThanOrEqual(140)
      expect(q.choices).toHaveLength(4)
      expect(q.choices).toContain(q.tempo)
      for (let j = 1; j < q.choices.length; j++) expect(q.choices[j] - q.choices[j - 1]).toBeGreaterThanOrEqual(CHOICE_GAP)
      expect(q.cells).toHaveLength(3)
      expect(q.pitches).toHaveLength(onsets(q.cells).length)
    }
  })

  it('normal et expert : entre 40 et 200, à 10 puis 4 près', () => {
    for (let i = 0; i < 200; i++) {
      const q = createFindQuestion('expert')
      expect(q.tempo).toBeGreaterThanOrEqual(FIND_LEVELS.expert.low)
      expect(q.tempo).toBeLessThanOrEqual(FIND_LEVELS.expert.high)
    }
    expect(isTempoClose('normal', 110, 100)).toBe(true)
    expect(isTempoClose('normal', 111, 100)).toBe(false)
    expect(isTempoClose('expert', 104, 100)).toBe(true)
    expect(isTempoClose('expert', 105, 100)).toBe(false)
  })

  it('noms italiens et réglages', () => {
    expect(tempoName(50)).toBe('Largo')
    expect(tempoName(120)).toBe('Allegro')
    expect(parseFindSettings({ questions: '5', level: 'expert' })).toEqual({ questions: 5, level: 'expert' })
  })
})
