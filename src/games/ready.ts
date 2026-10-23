/**
 * Écran « Je suis prêt » : pour les jeux sans diapason pendant les questions, on le
 * propose sur un écran à part, après les réglages et avant la première question.
 */

export const READY_GAMES = {
  'quelle-note': { slug: 'quelle-note', title: 'Quelle est la note ?' },
  'chante-note': { slug: 'chante-note', title: 'Chante la note' },
} as const

export type ReadyGame = (typeof READY_GAMES)[keyof typeof READY_GAMES]

export function readyGame(raw: unknown): ReadyGame {
  return READY_GAMES[(typeof raw === 'string' && raw in READY_GAMES ? raw : 'quelle-note') as keyof typeof READY_GAMES]
}

/** Écran suivant les réglages : l'écran diapason si le jeu n'en a pas pendant les questions, sinon le jeu. */
export function afterSettings(slug: keyof typeof READY_GAMES, noTuningFork: boolean, query: string): string {
  return `/games/${slug}/${noTuningFork ? 'pret' : 'jouer'}?${query}`
}
