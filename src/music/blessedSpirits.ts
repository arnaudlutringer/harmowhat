import type { SequenceNote } from '@/audio/engine'

/**
 * « Danse des esprits bienheureux » (Gluck, « Orphée et Eurydice », 1762, domaine public), à la flûte, en fa majeur :
 * la première phrase du solo, jusqu'au fa où elle se pose. Environ 10 secondes. Temps en noires (3/4, noire = 80).
 * Notes relevées dans la partition de flutetunes.com.
 */

export const BLESSED_SPIRITS_BEAT = 60 / 80

const [A4, Bb4, C5, E5, F5, G5, A5, Bb5] = [69, 70, 72, 76, 77, 79, 81, 82]

/** [note, début, durée], en noires. */
const melody: [number, number, number][] = [
  [C5, 0, 1], [A4, 1, 0.5], [Bb4, 1.5, 0.5], [C5, 2, 0.5], [F5, 2.5, 0.5], [F5, 3, 4],
  [Bb5, 7, 0.5], [A5, 7.5, 0.5], [G5, 8, 0.5], [A5, 8.5, 0.5], [G5, 9, 1], [F5, 10, 1], [E5, 11, 1],
  [F5, 12, 1.3],
]

export const BLESSED_SPIRITS: readonly SequenceNote[] = melody.map(([midi, at, len]) => ({ midi, at, len: len * 0.95, velocity: 0.5 }))
