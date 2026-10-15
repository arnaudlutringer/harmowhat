import type { SequenceNote } from '@/audio/engine'

/**
 * Caprice n° 24 (op. 1) de Paganini, en la mineur : le thème (la la la-do-si-la | mi mi mi-sol♯-fa♯-mi…),
 * sa reprise, puis le début de la seconde partie. Seules les 10 premières secondes sont jouées
 * (voir endings.ts). Temps en doubles croches (2/4, quasi Presto).
 * Notes relevées dans l'édition LilyPond du Mutopia Project (PaganiniN/O1, Caprice 24).
 */

export const PAGANINI_SIXTEENTH = 0.125

const [A3, E4, Fs4, Gs4, A4, B4, C5, D5, Ds5, E5, F5, G5, A5, Bb5] = [57, 64, 66, 68, 69, 71, 72, 74, 75, 76, 77, 79, 81, 82]
const F4 = 65

/** Une mesure du motif : croche, demi-soupir, puis cinq doubles croches. */
const motif = (a: number, b: number, c: number, d: number, e: number): [number, number][] => [
  [a, 2], [0, 1], [b, 1], [b, 1], [c, 1], [d, 1], [e, 1],
]

const firstHalf: [number, number][] = [
  ...motif(A4, A4, C5, B4, A4),
  ...motif(E5, E4, Gs4, Fs4, E4),
  ...motif(A4, A4, C5, B4, A4),
  [E5, 4], [E4, 2], [0, 2],
]

const melody: [number, number][] = [
  ...firstHalf,
  ...firstHalf,
  ...motif(A5, A5, Bb5, A5, G5),
  ...motif(F5, D5, F5, E5, D5),
  ...motif(G5, G5, A5, G5, F5),
  ...motif(E5, C5, E5, D5, C5),
  // Fin de la seconde partie (au-delà des 10 premières secondes, gardée pour la phrase complète).
  ...motif(F5, B4, D5, C5, B4),
  ...motif(E5, A4, C5, B4, A4),
  [F4, 2], [0, 1], [Ds5, 1], [E4, 1], [E5, 1], [D5, 1], [B4, 1],
  [A4, 4], [A3, 2], [0, 2],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Attaques nettes : la croche est piquée, les doubles croches liées.
  if (midi) notes.push({ midi, at: t, len: len >= 2 ? len * 0.7 : len * 1.05, velocity: len === 2 ? 0.62 : 0.52 })
  t += len
}

export const PAGANINI_24: readonly SequenceNote[] = notes
