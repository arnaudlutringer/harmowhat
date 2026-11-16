import type { SequenceNote } from '@/audio/engine'

/**
 * Entracte de l'acte III de « Carmen » (Bizet, 1875, domaine public), à la flûte, en mi♭ majeur : la première
 * phrase du solo, jusqu'au si♭ grave qui la suspend. Environ 10 secondes. Temps en noires (noire = 96, un peu
 * plus allant que l'Andantino pour tenir en 10 secondes). Notes relevées dans la partition de flutetunes.com.
 */

export const CARMEN_ENTRACTE_BEAT = 60 / 96

const [Bb4, Eb5, F5, G5, Ab5, Bb5, C6, D6, Eb6] = [70, 75, 77, 79, 80, 82, 84, 86, 87]
const T = 1 / 3

/** [note, début, durée], en noires. */
const melody: [number, number, number][] = [
  [Eb5, 0, 1.5], [F5, 1.5, 0.5], [Ab5, 2, 0.5], [G5, 2.5, 0.5], [F5, 3, 0.5], [Eb5, 3.5, 0.5],
  // Si♭, puis le triolet do sol do.
  [Bb5, 4, 1], [C6, 5, T], [G5, 5 + T, T], [C6, 5 + 2 * T, T], [Bb5, 6, 1],
  [Bb5, 7.5, 0.5], [C6, 8, 0.5], [D6, 8.5, 0.5], [Eb6, 9, 1.5], [D6, 10.5, 0.5], [C6, 11, 0.5], [G5, 11.5, 0.5],
  // Sol, si♭ et son petit groupé, fa mi♭ fa, puis le si♭ grave.
  [G5, 12, 0.5], [Bb5, 12.5, 0.385], [F5, 12.885, 0.055], [G5, 12.94, 0.06], [F5, 13, 0.75], [Eb5, 13.75, 0.25], [F5, 14, 1], [Bb4, 15, 1],
]

export const CARMEN_ENTRACTE: readonly SequenceNote[] = melody.map(([midi, at, len]) => ({ midi, at, len: len * 0.95, velocity: 0.5 }))
