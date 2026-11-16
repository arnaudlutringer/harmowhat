import type { SequenceNote } from '@/audio/engine'

/**
 * Début du « Maple Leaf Rag » (Scott Joplin, 1899, domaine public), en la♭ majeur : la levée et les
 * 8 premières mesures, jusqu'à l'arpège qui monte sur 5 octaves. Environ 10 secondes.
 * Temps en doubles croches (2/4 = 8 unités). Notes relevées dans l'édition Mutopia (reproduction de
 * l'édition originale de 1899, domaine public, mutopiaproject.org).
 */

export const MAPLE_LEAF_SIXTEENTH = 60 / 100 / 4 // noire = 100, « Tempo di marcia »

const [Ab1, Ab2, B2, Eb2, E2, A2, Bb2] = [32, 44, 47, 39, 40, 45, 46]
const [Eb3, E3, G3, Ab3, A3, Bb3, B3, C4, Db4] = [51, 52, 55, 56, 57, 58, 59, 60, 61]
const [Eb4, E4, G4, Ab4, Bb4, B4, C5, Eb5, E5, Ab5, B5, Ab6] = [63, 64, 67, 68, 70, 71, 72, 75, 76, 80, 83, 92]

const notes: SequenceNote[] = []
/** Main droite (mélodie, souvent en octaves) et main gauche : note ou accord, temps et durée en doubles croches. */
const right = (at: number, midis: number[], len = 1) => midis.forEach((midi) => notes.push({ midi, at, len: len * 0.9, velocity: 0.5 }))
const left = (at: number, midis: number[], len = 2) => midis.forEach((midi) => notes.push({ midi, at, len: len * 0.9, velocity: 0.33 }))

// Levée : le mi♭ grave.
left(0, [Eb2, Eb3])

// Mesures 1 à 4 : le thème syncopé (la♭ mi♭ la♭ do mi♭… sol mi♭ sol si♭ mi♭), deux fois.
for (const bar of [2, 18]) {
  right(bar + 1, [Ab4])
  right(bar + 2, [Eb4, Eb5])
  right(bar + 3, [Ab4])
  right(bar + 4, [C5])
  right(bar + 5, [Eb4, Eb5], 2)
  right(bar + 7, [G4])
  right(bar + 8, [Eb4, Eb5])
  right(bar + 9, [G4])
  right(bar + 10, [Bb4])
  // Le mi♭ lié : tenu jusqu'à la fin de la mesure.
  right(bar + 11, [Eb4, Eb5], bar === 2 ? 5 : 3)
  // Main gauche : « basse, accord, accord, basse », en croches.
  left(bar, [Ab2, Ab3])
  left(bar + 2, [Eb3, Ab3, C4])
  left(bar + 4, [Eb3, Ab3, C4])
  left(bar + 6, [A2, A3])
  left(bar + 8, [Bb2, Bb3])
  left(bar + 10, [Eb3, G3, Db4])
  left(bar + 12, [Eb3, G3, Db4])
  left(bar + 14, [Eb2, Eb3])
}
right(33, [Eb4, Eb5])

// Mesures 5 et 6 : la♭ do♭ fa♭, puis mi♭ mi♭, deux fois.
for (const bar of [34, 42]) {
  right(bar + 1, [Ab4])
  right(bar + 2, [B4])
  right(bar + 3, [E4, E5])
  right(bar + 5, [Eb4, Eb5])
  if (bar === 34) right(bar + 7, [Eb4, Eb5])
  left(bar, [E2, E3], 4)
  left(bar + 4, [Eb2, Eb3])
  if (bar === 34) left(bar + 6, [Eb2, Eb3])
}

// Mesures 7 et 8 : l'arpège de la♭ qui monte des deux mains, du la♭ grave au la♭ aigu.
const arpeggio: [number, number][] = [
  [51, Ab2], [52, B2], [53, Ab3], [55, Ab3], [56, B3], [57, Ab4],
  [59, Ab4], [60, B4], [61, Ab5], [63, Ab5], [64, B5], [65, Ab6],
]
for (const [at, midi] of arpeggio) right(at, [midi], at === 65 ? 2 : 1)
for (const [at, midi] of [[50, Ab1], [54, Ab2], [58, Ab3], [62, Ab4]]) left(at, [midi])

export const MAPLE_LEAF: readonly SequenceNote[] = notes.sort((a, b) => a.at - b.at)
