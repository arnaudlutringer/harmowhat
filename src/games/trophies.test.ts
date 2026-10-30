import { beforeEach, describe, expect, it } from 'vitest'

// Stockage de l'appareil, simulé en mémoire.
const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage

const { evaluateGame, takePendingTrophies, trophyEvent, TROPHIES, GOAT_POINTS, earnedTrophies } = await import('./trophies')

const results = (points: number[], correct = true) => points.map((p) => ({ correct, points: correct ? p : 0 }))
const game = (over: Partial<Parameters<typeof evaluateGame>[0]> = {}) =>
  evaluateGame({
    board: { game: 'grave-ou-aigu', level: 'normal', questions: 10 },
    results: results(Array(10).fill(6000)),
    instrument: 'piano',
    forkAvailable: true,
    forkUsed: true,
    ...over,
  })
const ids = () => takePendingTrophies().map((p) => p.trophy.id)

describe('Trophées', () => {
  beforeEach(() => store.clear())

  it('propose une cinquantaine de trophées, sans doublon', () => {
    expect(TROPHIES.length).toBe(50)
    expect(new Set(TROPHIES.map((t) => t.id)).size).toBe(TROPHIES.length)
  })

  it('débloque le niveau Impossible après un sans faute en expert à plus de 9 000 points par question', async () => {
    const { impossibleUnlocked, visibleLevels } = await import('./trophies')
    const levels = { expert: 1, impossible: 2 }
    const expert = { game: 'accords' as const, level: 'expert', questions: 10 }
    game({ board: expert, results: results([...Array(9).fill(9500), 9000]) })
    expect(ids()).not.toContain('impossible')
    expect(Object.keys(visibleLevels('accords', levels))).toEqual(['expert'])
    game({ board: { ...expert, level: 'normal' }, results: results(Array(10).fill(9500)) })
    expect(impossibleUnlocked.value).not.toContain('accords')
    game({ board: expert, results: results(Array(10).fill(9500)) })
    const announced = ids()
    expect(announced).toContain('impossible-accords')
    expect(announced).toContain('impossible')
    expect(impossibleUnlocked.value).toContain('accords')
    expect(Object.keys(visibleLevels('accords', levels))).toEqual(['expert', 'impossible'])
    // Débloqué une fois pour toutes : pas de nouvelle annonce.
    game({ board: expert, results: results(Array(10).fill(9500)) })
    expect(ids()).not.toContain('impossible-accords')
  })

  it('donne Premiers pas, Sans faute et Virtuose à un premier questionnaire parfait, une seule fois', () => {
    game()
    expect(ids()).toEqual(['premiers-pas', 'sans-faute', 'virtuose'])
    game()
    expect(ids()).toEqual([])
  })

  it('Sans filet : seulement si le diapason était proposé et n’a pas servi', () => {
    game({ forkAvailable: false, forkUsed: false })
    expect(ids()).not.toContain('sans-filet')
    game({ forkUsed: false })
    expect(ids()).toContain('sans-filet')
  })

  it('paliers de rapidité, et GOAT au niveau joué (puis au niveau supérieur)', () => {
    game({ results: results(Array(10).fill(GOAT_POINTS)) })
    expect(ids()).toEqual(expect.arrayContaining(['rapide', 'tres-rapide', 'fulgurant', 'reflexe', 'goat-grave-ou-aigu']))
    expect(earnedTrophies.value['goat-grave-ou-aigu'].tier).toBe('normal')
    game({ board: { game: 'grave-ou-aigu', level: 'debutant', questions: 10 }, results: results(Array(10).fill(GOAT_POINTS)) })
    expect(ids()).not.toContain('goat-grave-ou-aigu')
    game({ board: { game: 'grave-ou-aigu', level: 'expert', questions: 10 }, results: results(Array(10).fill(GOAT_POINTS)) })
    expect(ids()).toContain('goat-grave-ou-aigu')
    expect(earnedTrophies.value['goat-grave-ou-aigu'].tier).toBe('expert')
  })

  it('une mauvaise réponse empêche les trophées de rapidité', () => {
    game({ results: [...results(Array(9).fill(9800)), { correct: false, points: 0 }] })
    expect(ids()).not.toContain('fulgurant')
  })

  it('compte les jours de suite', () => {
    for (let d = 1; d <= 7; d++) game({ now: new Date(`2026-11-0${d}T10:00:00Z`) })
    expect(ids()).toContain('regulier')
  })

  it('trophées de la voix et du solfège au fil des bonnes réponses', () => {
    trophyEvent({ type: 'sung', pitchClass: 9, cents: 1 })
    expect(ids().sort()).toEqual(['diapason-humain', 'juste'])
    for (const clef of ['sol', 'fa', 'ut3']) trophyEvent({ type: 'clef', clef })
    expect(ids()).toEqual(['toutes-les-cles'])
  })

  it('La catastrophe : aucune bonne réponse', () => {
    game({ results: results(Array(10).fill(0), false) })
    expect(ids()).toContain('catastrophe')
  })
})
