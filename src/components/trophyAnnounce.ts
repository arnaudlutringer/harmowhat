/**
 * Durées de l'annonce des trophées en fin de partie : un par un s'il y en a peu, tous ensemble dans une seule
 * fenêtre au-delà de 3 (pour ne pas faire attendre le joueur trop longtemps).
 */

/** À partir de ce nombre, les trophées s'annoncent ensemble. */
export const GROUP_FROM = 4
/** Durée d'affichage d'un trophée seul, puis de l'envol vers « Mes trophées » (ms). */
export const SHOW_MS = 2000
export const FLY_MS = 700
/** Durée d'affichage de la fenêtre groupée (ms). */
export const GROUP_SHOW_MS = 3500

/** Durée totale de l'annonce de ces trophées (ms). */
export function announceMs(count: number): number {
  if (count === 0) return 0
  return count >= GROUP_FROM ? GROUP_SHOW_MS + FLY_MS : count * (SHOW_MS + FLY_MS)
}
