import type { SequenceNote } from '@/audio/engine'

/**
 * « The House of the Rising Sun », chanson populaire américaine (mélodie traditionnelle), en ré mineur :
 * le premier couplet, sur des accords arpégés à la guitare. Seules les 10 premières secondes sont jouées
 * (voir endings.ts). Temps en noires (3/4, noire = 144).
 * Mélodie relevée dans la transcription ABC de Frank Nordberg (musicaviva.com).
 */

export const RISING_SUN_BEAT = 60 / 144

const [A3, D4, E4, F4, G4, Gs4, A4, C5, D5] = [57, 62, 64, 65, 67, 68, 69, 72, 74]

/** [note, durée en noires], 0 étant un silence ; la levée, puis une mesure par groupe. */
const melody: [number, number][] = [
  [A4, 1],
  [D4, 2], [E4, 0.5], [D4, 0.5],
  [F4, 2], [G4, 0.5], [Gs4, 0.5],
  [A4, 2], [F4, 0.5], [E4, 0.5],
  [D4, 2], [A4, 1],
  [D5, 2], [A4, 1],
  [C5, 2], [A4, 0.5], [G4, 0.5],
  [A4, 4], [0, 1], [A4, 0.5], [A4, 0.5],
  [D5, 2], [D4, 1],
  [F4, 2], [G4, 1],
  [A4, 0.5], [A4, 1.5], [F4, 0.5], [E4, 0.5],
  [D4, 2], [A4, 1],
  [A4, 2], [A4, 1],
  [A4, 0.5], [A3, 1.5], [F4, 0.5], [E4, 0.5],
  [D4, 3],
]

/** Accords arpégés en croches (fondamentale, quinte, octave, tierce, octave, quinte), une mesure chacun. */
const Dm = [50, 57, 62, 65]
const A7 = [45, 52, 57, 61]
const C7 = [48, 55, 60, 64]
const F = [41, 48, 53, 57]
const Bb7 = [46, 53, 58, 62]
const bars = [Dm, Dm, A7, Dm, Dm, C7, F, A7, Dm, Dm, Dm, Bb7, Dm, A7, Dm, Dm]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  if (midi) notes.push({ midi, at: t, len: len * 1.05, velocity: 0.6 })
  t += len
}
bars.forEach((chord, i) => {
  const bar = 1 + i * 3
  ;[0, 1, 2, 3, 2, 1].forEach((k, j) => notes.push({ midi: chord[k], at: bar + j / 2, len: 1, velocity: 0.28 }))
})

export const RISING_SUN: readonly SequenceNote[] = notes.sort((a, b) => a.at - b.at)
