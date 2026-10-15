import { describe, expect, it } from 'vitest'
import { INSTRUMENTS, sampleMidis } from './instruments'
// @ts-expect-error script Node sans types
import { RANGES, sampleMidis as scriptMidis } from '../../scripts/fetch-samples.mjs'

describe('Script de téléchargement des échantillons', () => {
  it('télécharge exactement les notes utilisées par chaque instrument (hors piano)', () => {
    for (const [id, range] of Object.entries(RANGES) as [keyof typeof INSTRUMENTS, [number, number]][]) {
      expect(range).toEqual([INSTRUMENTS[id].low, INSTRUMENTS[id].high])
      expect(scriptMidis(range)).toEqual(sampleMidis(INSTRUMENTS[id]))
    }
    expect(Object.keys(RANGES).sort()).toEqual(Object.keys(INSTRUMENTS).filter((id) => id !== 'piano').sort())
  })
})
