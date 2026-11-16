import type { SequenceNote } from '@/audio/engine'

/**
 * « La Cucaracha », chanson populaire mexicaine (traditionnelle, domaine public), à la trompette, en sol majeur :
 * le refrain (la cucaracha, la cucaracha…) jusqu'au sol qui conclut la phrase. Un peu moins de 10 secondes.
 * Temps en croches (noire = 200). Notes relevées dans la partition de flutetunes.com (air traditionnel).
 */

export const LA_CUCARACHA_EIGHTH = 60 / 200 / 2

const [D4, E4, Fs4, G4, A4, B4, C5, D5, E5] = [62, 64, 66, 67, 69, 71, 72, 74, 76]

/** [note, début, durée], en croches. */
const melody: [number, number, number][] = [
  // La cu-ca-ra-cha, la cu-ca-ra-cha…
  [D4, 0, 1], [D4, 1, 1], [D4, 2, 1], [G4, 3, 3], [B4, 6, 2],
  [D4, 8, 1], [D4, 9, 1], [D4, 10, 1], [G4, 11, 3], [B4, 14, 5],
  // … ya no puede caminar.
  [G4, 20, 2], [G4, 22, 1], [Fs4, 23, 1], [Fs4, 24, 1], [E4, 25, 1], [E4, 26, 1], [D4, 27, 4],
  // Porque no tiene, porque le falta…
  [D4, 32, 1], [D4, 33, 1], [D4, 34, 1], [Fs4, 35, 3], [A4, 38, 2],
  [D4, 40, 1], [D4, 41, 1], [D4, 42, 1], [Fs4, 43, 3], [A4, 46, 5],
  // … et la fin de la phrase, sur le sol.
  [D5, 52, 2], [E5, 54, 1], [D5, 55, 1], [C5, 56, 1], [B4, 57, 1], [A4, 58, 1], [B4, 59, 3], [G4, 62, 2],
]

export const LA_CUCARACHA: readonly SequenceNote[] = melody.map(([midi, at, len]) => ({ midi, at, len: len * 0.85, velocity: len === 1 ? 0.5 : 0.6 }))
