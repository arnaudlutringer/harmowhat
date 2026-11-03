import type { GameId } from '@/games/highScores'

/**
 * Fonctionnalités en préparation, désactivées tant qu'elles ne sont pas prêtes.
 * Pour en activer une pour tout le monde : passer sa valeur à true ici, puis refaire l'APK.
 *
 * Tests en local (npm run dev seulement, jamais dans l'APK) : ?matchs=1 dans l'adresse d'un écran active
 * la fonctionnalité sur ce navigateur, ?matchs=0 revient à la valeur ci-dessous. Le choix est mémorisé.
 */
export const FEATURES = {
  /** Matchs à distance : défier un autre joueur sur le même jeu, avec les mêmes questions. */
  matchs: false,
  /** « Lis et chante » : lire les notes d'une portée qui défile et les chanter au micro. */
  lectureChantee: true,
  /** « Lis et dis » : lire les notes d'une portée qui défile et dire leur nom au micro. */
  lectureParlee: true,
}

export type Feature = keyof typeof FEATURES

const DEV_KEY = 'harmowhat.dev.features'

function devOverrides(): Partial<Record<Feature, boolean>> {
  if (!import.meta.env?.DEV || typeof location === 'undefined') return {}
  try {
    const saved = JSON.parse(localStorage.getItem(DEV_KEY) ?? '{}') as Partial<Record<Feature, boolean>>
    const params = new URLSearchParams(location.search)
    for (const f of Object.keys(FEATURES) as Feature[]) {
      if (params.get(f) === '1') saved[f] = true
      if (params.get(f) === '0') delete saved[f]
    }
    localStorage.setItem(DEV_KEY, JSON.stringify(saved))
    return saved
  } catch {
    return {}
  }
}

/** Jeux derrière un interrupteur : absents de l'accueil, des classements et des trophées tant qu'il est coupé. */
export const GAME_FEATURES: Partial<Record<GameId, Feature>> = {
  'lis-chante': 'lectureChantee',
  'lis-dis': 'lectureParlee',
}

/** Le jeu est-il proposé (pas d'interrupteur, ou interrupteur actif) ? */
export function gameEnabled(game: GameId): boolean {
  const feature = GAME_FEATURES[game]
  return !feature || featureEnabled(feature)
}

/** La fonctionnalité est-elle active (valeur du fichier, ou interrupteur de test en local) ? */
export function featureEnabled(feature: Feature): boolean {
  return devOverrides()[feature] ?? FEATURES[feature]
}
