import type { SequenceNote } from '@/audio/engine'

/**
 * « Le Cygne » (Le Carnaval des animaux, n° 13) de Saint-Saëns, en sol majeur : l'entrée du violoncelle,
 * la phrase qui descend (sol fa♯ si mi ré sol), puis la ~ si do, jusqu'à la première respiration.
 * Exactement 10 secondes. Temps en noires (6/4, Andantino grazioso).
 * Notes relevées dans la partie de violoncelle (IMSLP n° 26482).
 */

export const SWAN_BEAT = 10 / 12 // noire = 72 : les deux premières mesures en 10 s

const [G3, A3, B3, C4, D4, E4, Fs4, G4] = [55, 57, 59, 60, 62, 64, 66, 67]

/** [note, durée en noires], 0 étant un silence. */
const melody: [number, number][] = [
  [G4, 1], [Fs4, 1], [B3, 1], [E4, 1], [D4, 1], [G3, 1],
  [A3, 2.5], [B3, 0.5], [C4, 2], [0, 1],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Legato : chaque note tient jusqu'à la suivante (archet lié).
  if (midi) notes.push({ midi, at: t, len: len * 1.08, velocity: 0.5 })
  t += len
}

export const SWAN: readonly SequenceNote[] = notes
