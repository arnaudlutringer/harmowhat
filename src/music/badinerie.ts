import type { SequenceNote } from '@/audio/engine'

/**
 * Badinerie (Suite pour orchestre n° 2, BWV 1067) de Bach, en si mineur : la levée et les 8 premières
 * mesures de la flûte, soit les 10 premières secondes. Temps en doubles croches (2/4).
 * Notes relevées dans la partie de flûte (Orchestra Parts Project, IMSLP n° 46924).
 */

export const BADINERIE_SIXTEENTH = 10 / 68 // la levée et 8 mesures (68 doubles croches) en 10 s

const [Fs4, As4, B4, Cs5, D5, E5, Fs5, B5, D6] = [66, 70, 71, 73, 74, 76, 78, 83, 86]

/** [note, durée en doubles croches, piqué ?]. */
const melody: [number, number, boolean?][] = [
  [B5, 2], [D6, 1], [B5, 1],
  [Fs5, 2], [B5, 1], [Fs5, 1], [D5, 2], [Fs5, 1], [D5, 1],
  [B4, 4], [Fs4, 1], [B4, 1], [D5, 1], [B4, 1],
  [Cs5, 1], [B4, 1], [Cs5, 1], [B4, 1], [As4, 1], [Cs5, 1], [E5, 1], [Cs5, 1],
  [D5, 2], [B4, 2], [B5, 2], [D6, 1], [B5, 1],
  [Fs5, 2], [B5, 1], [Fs5, 1], [D5, 2], [Fs5, 1], [D5, 1],
  [B4, 4], [D5, 2, true], [D5, 2, true],
  [D5, 2, true], [D5, 2, true], [B5, 2], [D5, 2],
  // Do♯ trillé, puis si, et deux mi piqués.
  [D5, 0.5], [Cs5, 0.5], [D5, 0.5], [Cs5, 0.5], [B4, 2], [E5, 2, true], [E5, 2, true],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len, staccato] of melody) {
  notes.push({ midi, at: t, len: staccato ? len * 0.5 : len * 0.95, velocity: 0.55 })
  t += len
}

export const BADINERIE: readonly SequenceNote[] = notes
