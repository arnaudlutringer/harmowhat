import type { SequenceNote } from '@/audio/engine'

/**
 * « The Irish Washerwoman », gigue irlandaise traditionnelle (imprimée dès 1788, domaine public), au violon,
 * en sol majeur : la levée ré do et la première partie (8 mesures), jusqu'au sol. Environ 9 secondes.
 * Temps en croches (6/8, noire pointée = 112). Notes relevées dans la version de référence de thesession.org
 * (|:BGG DGG|BGB dcB|cAA EAA|cAc edc|BGG DGG|BGB dcB|cBc Adc|BGG G3:|).
 */

export const IRISH_WASHERWOMAN_EIGHTH = 60 / 112 / 3

const [D4, E4, G4, A4, B4, C5, D5, E5] = [62, 64, 67, 69, 71, 72, 74, 76]

/** [note, durée en croches]. */
const melody: [number, number][] = [
  // Levée.
  [D5, 1], [C5, 1],
  [B4, 1], [G4, 1], [G4, 1], [D4, 1], [G4, 1], [G4, 1],
  [B4, 1], [G4, 1], [B4, 1], [D5, 1], [C5, 1], [B4, 1],
  [C5, 1], [A4, 1], [A4, 1], [E4, 1], [A4, 1], [A4, 1],
  [C5, 1], [A4, 1], [C5, 1], [E5, 1], [D5, 1], [C5, 1],
  [B4, 1], [G4, 1], [G4, 1], [D4, 1], [G4, 1], [G4, 1],
  [B4, 1], [G4, 1], [B4, 1], [D5, 1], [C5, 1], [B4, 1],
  [C5, 1], [B4, 1], [C5, 1], [A4, 1], [D5, 1], [C5, 1],
  [B4, 1], [G4, 1], [G4, 1], [G4, 3],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Le premier temps de chaque groupe de trois croches est appuyé, comme au fiddle.
  const strong = (t - 2) % 3 === 0
  notes.push({ midi, at: t, len: len * 0.85, velocity: strong ? 0.6 : 0.45 })
  t += len
}

export const IRISH_WASHERWOMAN: readonly SequenceNote[] = notes
