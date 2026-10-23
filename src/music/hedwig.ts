import type { SequenceNote } from '@/audio/engine'

/**
 * « Hedwig's Theme » (Harry Potter à l'école des sorciers, John Williams, 2001), au violoncelle, en mi mineur :
 * la levée si mi sol, puis la première phrase jusqu'au si grave tenu. Un peu moins de 10 secondes.
 * Temps en croches (4/4).
 * Notes relevées dans l'arrangement pour violoncelle de Camerun Washington (Free-scores.com).
 */

export const HEDWIG_EIGHTH = 0.36

const [B2, D3, E3, F3, Fs3, G3, A3, B3] = [47, 50, 52, 53, 54, 55, 57, 59]

/** [note, durée en croches]. */
const melody: [number, number][] = [
  [B2, 1], [E3, 1.5], [G3, 0.5],
  [Fs3, 1], [E3, 2], [B3, 1], [A3, 3],
  [Fs3, 3], [E3, 1.5], [G3, 0.5], [Fs3, 1], [D3, 2], [F3, 1],
  [B2, 5],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Legato : chaque note tient jusqu'à la suivante (archet lié).
  notes.push({ midi, at: t, len: len * 1.08, velocity: 0.5 })
  t += len
}

export const HEDWIG: readonly SequenceNote[] = notes
