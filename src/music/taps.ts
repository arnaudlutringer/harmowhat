import type { SequenceNote } from '@/audio/engine'

/**
 * « Taps », la sonnerie aux morts de l'armée américaine (1862, domaine public), à la trompette :
 * trois notes de l'accord de do (sol, do, mi), puis le sol aigu, très lentement, avec des points d'orgue.
 * Seules les 10 premières secondes sont jouées (voir endings.ts). Temps en croches (noire = 48).
 * Notes relevées dans la transcription ABC de Frank Nordberg (musicaviva.com).
 */

export const TAPS_EIGHTH = 60 / 48 / 2

const [G4, C5, E5, G5] = [67, 72, 76, 79]

/** [note, durée en croches] : le rythme pointé « sol—sol » qui annonce chaque note tenue. */
const melody: [number, number][] = [
  [G4, 1.5], [G4, 0.5], [C5, 6],
  [G4, 1.5], [C5, 0.5], [E5, 6],
  [G4, 1.5], [C5, 0.5], [E5, 2], [G4, 1.5], [C5, 0.5], [E5, 2],
  [G4, 1.5], [C5, 0.5], [E5, 6],
  [C5, 1.5], [E5, 0.5], [G5, 6],
  [E5, 1.5], [C5, 0.5], [G4, 6],
  [G4, 1.5], [G4, 0.5], [C5, 6],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  notes.push({ midi, at: t, len: len * 0.95, velocity: len >= 6 ? 0.6 : 0.5 })
  t += len
}

export const TAPS: readonly SequenceNote[] = notes
