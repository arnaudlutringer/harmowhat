import type { SequenceNote } from '@/audio/engine'

/**
 * « When the Saints Go Marching In », air traditionnel américain (domaine public), à la trompette, en sol majeur,
 * comme une fanfare de La Nouvelle-Orléans : « Oh when the saints go marching in » deux fois, puis la phrase qui se
 * pose sur le la. Environ 9 secondes. Temps en noires (noire = 224).
 * Notes relevées dans la partition de flutetunes.com (air traditionnel).
 */

export const SAINTS_BEAT = 60 / 224

const [G4, A4, B4, C5, D5] = [67, 69, 71, 72, 74]

/** [note, début, durée], en noires. */
const melody: [number, number, number][] = [
  // Oh when the saints…
  [G4, 0, 1], [B4, 1, 1], [C5, 2, 1], [D5, 3, 5],
  // Oh when the saints…
  [G4, 8, 1], [B4, 9, 1], [C5, 10, 1], [D5, 11, 5],
  // Oh when the saints go marching in.
  [G4, 16, 1], [B4, 17, 1], [C5, 18, 1], [D5, 19, 2], [B4, 21, 2], [G4, 23, 2], [B4, 25, 2], [A4, 27, 5],
]

export const SAINTS: readonly SequenceNote[] = melody.map(([midi, at, len]) => ({ midi, at, len: len * 0.9, velocity: len === 1 ? 0.5 : 0.6 }))
