import type { SequenceNote } from '@/audio/engine'

/**
 * « Au matin » (Morgenstemning, Peer Gynt, suite n° 1, op. 46) de Grieg, en mi majeur : le motif pastoral
 * de la flûte (si sol♯ fa♯ mi fa♯ sol♯…), ses 4 premières mesures avant la réponse du hautbois.
 * Temps en croches (6/8, Allegretto pastorale). Notes relevées dans la partie de flûte (IMSLP n° 40004).
 */

export const MORNING_EIGHTH = 0.38

const [E5, Fs5, Gs5, B5, Cs6] = [76, 78, 80, 83, 85]

/** [note, durée en croches], 0 étant un silence. */
const melody: [number, number][] = [
  [B5, 1], [Gs5, 1], [Fs5, 1], [E5, 1], [Fs5, 1], [Gs5, 1],
  [B5, 1], [Gs5, 1], [Fs5, 1], [E5, 1], [Fs5, 0.5], [Gs5, 0.5], [Fs5, 0.5], [Gs5, 0.5],
  [B5, 1], [Gs5, 1], [B5, 1], [Cs6, 1], [Gs5, 1], [Cs6, 1],
  [B5, 1], [Gs5, 1], [Fs5, 1], [E5, 2], [0, 1],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  if (midi) notes.push({ midi, at: t, len: len * 1.1, velocity: 0.55 })
  t += len
}

export const MORNING_MOOD: readonly SequenceNote[] = notes
