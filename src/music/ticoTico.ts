import type { SequenceNote } from '@/audio/engine'

/**
 * « Tico-Tico no Fubá » (Zequinha de Abreu, 1917), choro brésilien, à la clarinette, en la mineur :
 * la levée et la première phrase, jusqu'au do tenu. Seules les 10 premières secondes sont jouées
 * (voir endings.ts). Temps en croches (4/4).
 * Notes relevées dans la partition pour clarinette de play-clarinet.franzdorfer.com (Free-scores.com).
 */

export const TICO_TICO_EIGHTH = 0.25

const [C4, D4, Eb4, E4, F4, Gs4, A4, B4, D5] = [60, 62, 63, 64, 65, 68, 69, 71, 74]
const REST = 0

/** [note, durée en croches] ; REST pour un silence. */
const melody: [number, number][] = [
  [E4, 1], [Eb4, 1], [E4, 1],
  [F4, 1], [E4, 1], [REST, 1], [A4, 1], [REST, 1], [E4, 1], [Eb4, 1], [E4, 1],
  [F4, 1], [E4, 1], [REST, 1], [Gs4, 2], [E4, 1], [Eb4, 1], [E4, 1],
  [F4, 1], [E4, 1], [D5, 1], [B4, 1], [Gs4, 1], [E4, 1], [Eb4, 1], [D4, 1],
  [C4, 6],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  if (midi !== REST) notes.push({ midi, at: t, len: len * 0.9, velocity: len >= 2 ? 0.6 : 0.52 })
  t += len
}

export const TICO_TICO: readonly SequenceNote[] = notes
