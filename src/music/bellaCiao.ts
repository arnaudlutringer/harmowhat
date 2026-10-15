import type { SequenceNote } from '@/audio/engine'

/**
 * « Bella ciao », chant populaire italien (mélodie traditionnelle), en sol mineur : le couplet entier,
 * de « Una mattina » au retour sur le sol. Environ 11 secondes. Temps en croches (4/4).
 */

export const BELLA_CIAO_EIGHTH = 0.17 // secondes par croche (allant)

const [D4, G4, A4, Bb4, C5, D5, Eb5] = [62, 67, 69, 70, 72, 74, 75]

/** [note, durée en croches], une note à 0 étant un silence. */
const melody: [number, number][] = [
  [D4, 1], [G4, 1], [A4, 1],
  [Bb4, 1], [G4, 4], [D4, 1], [G4, 1], [A4, 1],
  [Bb4, 1], [G4, 4], [D4, 1], [G4, 1], [A4, 1],
  [Bb4, 2], [A4, 1], [G4, 1], [Bb4, 2], [A4, 1], [G4, 1],
  [D5, 2], [D5, 2], [D5, 1], [D5, 1], [C5, 1], [D5, 1],
  [Eb5, 1], [Eb5, 4], [Eb5, 1], [D5, 1], [C5, 1],
  [Eb5, 1], [D5, 4], [D5, 1], [C5, 1], [Bb4, 1],
  [A4, 2], [D5, 2], [Bb4, 2], [A4, 2],
  [G4, 6],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Notes légèrement détachées, comme un coup de langue à la clarinette.
  if (midi) notes.push({ midi, at: t, len: len * 0.9 })
  t += len
}

export const BELLA_CIAO: readonly SequenceNote[] = notes
