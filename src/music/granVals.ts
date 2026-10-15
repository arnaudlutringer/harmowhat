import type { SequenceNote } from '@/audio/engine'

/**
 * « Gran Vals » de Francisco Tárrega, en la majeur, pour guitare : la mélodie du début, de la levée
 * (petite note glissée vers mi) à la 6ᵉ mesure. Temps en noires (3/4).
 * Notes relevées dans la partition de l'édition originale (IMSLP n° 44650), en sons réels
 * (une octave sous l'écriture de la guitare).
 */

export const GRAN_VALS_BEAT = 0.36

const [D4, E4, Fs4, Gs4, A4] = [62, 64, 66, 68, 69]

/** [note, durée en noires]. */
const melody: [number, number][] = [
  [D4, 0.15], [E4, 0.85],
  [E4, 3],
  [Fs4, 3],
  [Fs4, 3],
  [Fs4, 2], [A4, 1],
  [A4, 2], [Gs4, 1],
  [E4, 0.15], [Fs4, 2.85],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  notes.push({ midi, at: t, len: len * 1.05, velocity: len < 0.5 ? 0.4 : 0.6 })
  t += len
}

export const GRAN_VALS: readonly SequenceNote[] = notes
