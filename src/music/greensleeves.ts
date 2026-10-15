import type { SequenceNote } from '@/audio/engine'

/**
 * « Greensleeves », chanson populaire anglaise du XVIᵉ siècle, en sol mineur, à la guitare : la mélodie
 * sur des accords arpégés. Seules les 10 premières secondes sont jouées (voir endings.ts).
 * Temps en noires (6/4). Notes relevées dans la transcription ABC « B168 » (abc-music, Chris Spencer).
 */

export const GREENSLEEVES_BEAT = 0.5

const [D4, F4, Fs4, G4, A4, Bb4, C5, D5, Eb5] = [62, 65, 66, 67, 69, 70, 72, 74, 75]

/** [note, durée en noires] : la levée, puis une mesure de 6/4 par ligne. */
const melody: [number, number][] = [
  [G4, 1],
  [Bb4, 2], [C5, 1], [D5, 1.5], [Eb5, 0.5], [D5, 1],
  [C5, 2], [A4, 1], [F4, 1.5], [G4, 0.5], [A4, 1],
  [Bb4, 2], [G4, 1], [G4, 1.5], [Fs4, 0.5], [G4, 1],
  [A4, 2], [Fs4, 1], [D4, 2], [G4, 1],
]

/** Accords arpégés (basse, quinte, octave, tierce, octave, quinte), un par mesure. */
const Gm = [43, 50, 55, 58]
const F = [41, 48, 53, 57]
const D = [50, 57, 62, 66]
const bars = [Gm, F, Gm, D]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  notes.push({ midi, at: t, len: len * 1.05, velocity: 0.6 })
  t += len
}
bars.forEach((chord, i) => {
  ;[0, 1, 2, 3, 2, 1].forEach((k, j) => notes.push({ midi: chord[k], at: 1 + i * 6 + j, len: 1.2, velocity: 0.28 }))
})

export const GREENSLEEVES: readonly SequenceNote[] = notes.sort((a, b) => a.at - b.at)
