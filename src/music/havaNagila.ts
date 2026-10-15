import type { SequenceNote } from '@/audio/engine'

/**
 * « Hava Nagila », chant populaire juif (mélodie traditionnelle), façon klezmer à la clarinette,
 * en ré (mode de sol mineur) : la première phrase et sa reprise. Seules les 10 premières secondes sont
 * jouées (voir endings.ts). Temps en croches (4/4).
 * Notes relevées dans la transcription ABC de John Chambers (trillian.mit.edu), une octave plus haut.
 */

export const HAVA_NAGILA_EIGHTH = 0.25

const [D5, Eb5, Fs5, G5, A5, Bb5] = [74, 75, 78, 79, 81, 82]

/** [note, durée en croches] : « Ha-va na-gi-la » trois fois, puis la fin de phrase. */
const opening: [number, number][] = [
  [D5, 2], [D5, 3], [Fs5, 1], [Eb5, 1], [D5, 1],
  [Fs5, 2], [Fs5, 3], [A5, 1], [G5, 1], [Fs5, 1],
  [G5, 2], [G5, 3], [Bb5, 1], [A5, 1], [G5, 1],
]
const melody: [number, number][] = [
  ...opening,
  [Fs5, 2], [Eb5, 0.5], [D5, 0.5], [Eb5, 1], [Fs5, 4],
  ...opening,
  [Fs5, 2], [Eb5, 0.5], [D5, 0.5], [Eb5, 1], [D5, 4],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  notes.push({ midi, at: t, len: len * 0.95, velocity: len >= 2 ? 0.6 : 0.52 })
  t += len
}

export const HAVA_NAGILA: readonly SequenceNote[] = notes
