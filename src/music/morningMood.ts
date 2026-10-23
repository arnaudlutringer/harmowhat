import type { SequenceNote } from '@/audio/engine'

/**
 * « Au matin » (Morgenstemning, Peer Gynt, suite n° 1, op. 46) de Grieg, en mi majeur : le motif pastoral
 * de la flûte (si sol♯ fa♯ mi fa♯ sol♯…), ses 4 premières mesures, avec leurs petites notes, sur un
 * accord de mi majeur tenu en dessous, comme les cordes de l'orchestre. Temps en croches (6/8, Allegretto
 * pastorale). Notes relevées dans la partition pour flûte transcrite par Jonathan C. Forster (1997).
 */

export const MORNING_EIGHTH = 0.38

const [E5, Fs5, Gs5, A5, B5, Cs6] = [76, 78, 80, 81, 83, 85]

/** [note, durée en croches], 0 étant un silence. */
const melody: [number, number][] = [
  [B5, 1], [Gs5, 1], [Fs5, 1], [E5, 1], [Fs5, 1], [Gs5, 1],
  [B5, 1], [Gs5, 1], [Fs5, 1], [E5, 1], [Fs5, 0.5], [Gs5, 0.5], [Fs5, 0.5], [Gs5, 0.5],
  [B5, 1], [Gs5, 1], [B5, 1], [Cs6, 1], [Gs5, 1], [Cs6, 1],
  [B5, 1], [Gs5, 1], [Fs5, 1], [E5, 2], [0, 1],
]

/** Petites notes (sol♯ la) glissées juste avant le temps : [croche où tombe la note principale]. */
const graces = [7, 12]

/** Accompagnement : mi grave et accord de mi majeur, tenus à chaque temps (noire pointée). */
const BASS = 64
const CHORD = [68, 71]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  if (midi) notes.push({ midi, at: t, len: len * 1.1, velocity: 0.55 })
  t += len
}
for (const at of graces) [Gs5, A5].forEach((midi, i) => notes.push({ midi, at: at - 0.3 + i * 0.15, len: 0.2, velocity: 0.4 }))
for (let at = 0; at < t; at += 3) {
  notes.push({ midi: BASS, at, len: 3, velocity: 0.3 })
  for (const midi of CHORD) notes.push({ midi, at, len: 3, velocity: 0.18 })
}

export const MORNING_MOOD: readonly SequenceNote[] = notes
