import type { SequenceNote } from '@/audio/engine'

/**
 * « Danse macabre » (op. 40) de Saint-Saëns : l'entrée du violon solo, la Mort qui accorde son violon
 * (la et mi♭ ensemble, le triton du diable, puis ré et la), en rythme de valse. L'œuvre commence par
 * 24 mesures d'orchestre (les douze coups de minuit à la harpe) : on joue ici la première phrase du
 * violon (7 mesures, environ 8 secondes), avant qu'il ne se taise. Temps en noires (3/4, mouvement modéré de valse).
 * Notes relevées dans la partie de violon solo (IMSLP n° 66553).
 */

export const DANSE_MACABRE_BEAT = 0.4

const DEVIL = [69, 75] // la et mi♭ : le triton
const OPEN = [62, 69] // ré et la, cordes à vide

/** [double corde, durée en noires], null étant un silence. */
const bars: [number[] | null, number][] = [
  [DEVIL, 3],
  [OPEN, 3],
  [DEVIL, 2], [DEVIL, 1],
  [OPEN, 2], [OPEN, 1],
  [DEVIL, 0.5], [DEVIL, 0.5], [DEVIL, 1], [OPEN, 1],
  [DEVIL, 0.5], [DEVIL, 0.5], [DEVIL, 1], [OPEN, 1],
  [DEVIL, 1], [OPEN, 1], [null, 1],
]

const notes: SequenceNote[] = []
let t = 0
for (const [chord, len] of bars) {
  // Coups d'archet francs, la note longue résonne un peu.
  if (chord) for (const midi of chord) notes.push({ midi, at: t, len: len >= 2 ? len * 0.95 : len * 0.7, velocity: 0.55 })
  t += len
}

export const DANSE_MACABRE: readonly SequenceNote[] = notes
