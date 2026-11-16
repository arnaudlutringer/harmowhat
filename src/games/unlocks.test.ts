import { beforeEach, describe, expect, it, vi } from 'vitest'

function fakeStorage() {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, String(v)), removeItem: (k: string) => void data.delete(k), clear: () => data.clear() }
}

async function fresh(alreadyPlayed = false) {
  vi.resetModules()
  vi.stubGlobal('localStorage', fakeStorage())
  const u = await import('./unlocks')
  u.initUnlocks(() => alreadyPlayed)
  return u
}

describe('Jeux à découvrir', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('commence avec 4 jeux, puis en ouvre un toutes les 2 parties', async () => {
    const u = await fresh()
    expect(u.unlockProgress.value.open).toBe(4)
    expect(u.isUnlocked('grave-ou-aigu')).toBe(true)
    expect(u.isUnlocked('quelle-note')).toBe(false)
    expect(u.nextUnlock.value).toEqual({ game: 'quelle-note', remaining: 2 })
    expect(u.recordFinishedGame()).toEqual([])
    expect(u.nextUnlock.value?.remaining).toBe(1)
    expect(u.recordFinishedGame()).toEqual(['quelle-note'])
    expect(u.isUnlocked('quelle-note')).toBe(true)
    expect(u.nextUnlock.value).toEqual({ game: 'joue-rythme', remaining: 2 })
  })

  it('ouvre le jeu du défi du jour relevé, même avant son tour', async () => {
    const u = await fresh()
    expect(u.recordFinishedGame('accords')).toEqual(['accords'])
    expect(u.isUnlocked('accords')).toBe(true)
  })

  it('garde tous les jeux ouverts pour un joueur qui avait déjà joué, et « Tout débloquer » ouvre tout', async () => {
    const old = await fresh(true)
    expect(old.allUnlocked.value).toBe(true)
    expect(old.recordFinishedGame()).toEqual([])
    const u = await fresh()
    u.unlockAll()
    expect(u.isUnlocked('lis-dis')).toBe(true)
    expect(u.nextUnlock.value).toBeNull()
  })

  it('ouvre les 16 jeux au bout de 24 parties', async () => {
    const u = await fresh()
    for (let i = 0; i < 24; i++) u.recordFinishedGame()
    expect(u.allUnlocked.value).toBe(true)
    expect(u.unlockProgress.value).toEqual({ open: 16, total: 16 })
  })
})
