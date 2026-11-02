/**
 * Hasard reproductible, pour les matchs : à partir de la même graine, les deux joueurs reçoivent exactement
 * les mêmes questions. Les jeux tirent leurs questions avec Math.random ; on le remplace le temps du tirage.
 */

/** Générateur pseudo-aléatoire (mulberry32) : nombres entre 0 et 1, toujours les mêmes pour une graine. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Exécute `fn` avec un Math.random tiré de la graine, puis remet le vrai hasard. */
export function withSeed<T>(seed: number, fn: () => T): T {
  const original = Math.random
  Math.random = seededRandom(seed)
  try {
    return fn()
  } finally {
    Math.random = original
  }
}

/** Une graine au hasard, pour un nouveau match. */
export const newSeed = () => Math.floor(Math.random() * 2 ** 31)

/** Graine lue dans l'adresse d'un jeu (« graine=… »), ou undefined hors match. */
export function seedFromQuery(query: Record<string, unknown>): number | undefined {
  const n = Number(query.graine)
  return Number.isInteger(n) && n >= 0 ? n : undefined
}
