import { describe, expect, it } from 'vitest'
import { announceMs, FLY_MS, GROUP_SHOW_MS, SHOW_MS } from './trophyAnnounce'

describe('Annonce des trophées', () => {
  it('un par un jusqu’à 3, puis tous ensemble dans une seule fenêtre', () => {
    expect(announceMs(0)).toBe(0)
    expect(announceMs(3)).toBe(3 * (SHOW_MS + FLY_MS))
    expect(announceMs(4)).toBe(GROUP_SHOW_MS + FLY_MS)
    expect(announceMs(9)).toBe(GROUP_SHOW_MS + FLY_MS)
  })
})
