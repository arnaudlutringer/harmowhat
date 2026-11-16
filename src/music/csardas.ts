import type { SequenceNote } from '@/audio/engine'

/**
 * « Csárdás » de Vittorio Monti (1904, domaine public), au violon, en ré mineur : le thème de l'Allegro vivo
 * (mi ré do♯, ré ré ; les doubles croches sautillées ré mi fa mi…), jusqu'au ré qui conclut la phrase.
 * Environ 10 secondes. Temps en doubles croches (2/4 = 8 unités, noire = 168).
 * Notes relevées dans la partie de violon de l'édition Carl Fischer de 1922 (domaine public, cantorion.org).
 */

export const CSARDAS_SIXTEENTH = 60 / 168 / 4

const [A4, B4, Cs5, D5, E5, F5, G5, A5, Bb5] = [69, 71, 73, 74, 76, 77, 79, 81, 82]

/** [note, durée en doubles croches] ; 0 = silence. */
const melody: [number, number][] = [
  // Mi ré do♯, ré ré.
  [E5, 2], [D5, 4], [Cs5, 2], [D5, 4], [D5, 2], [0, 2],
  // Doubles croches sautillées.
  [D5, 1], [E5, 1], [F5, 1], [E5, 1], [D5, 1], [E5, 1], [F5, 1], [E5, 1],
  [D5, 1], [E5, 1], [F5, 1], [E5, 1], [D5, 1], [E5, 1], [F5, 1], [D5, 1],
  // Fa mi do♯, mi mi.
  [F5, 2], [E5, 4], [Cs5, 2], [E5, 4], [E5, 2], [0, 2],
  // Sol la si♭ la…, puis fa sol la sol…
  [G5, 1], [A5, 1], [Bb5, 1], [A5, 1], [G5, 1], [A5, 1], [Bb5, 1], [A5, 1],
  [G5, 1], [A5, 1], [Bb5, 1], [A5, 1], [G5, 1], [Bb5, 1], [A5, 1], [G5, 1],
  [F5, 1], [G5, 1], [A5, 1], [G5, 1], [F5, 1], [G5, 1], [A5, 1], [G5, 1],
  [F5, 1], [G5, 1], [A5, 1], [G5, 1], [F5, 1], [G5, 1], [A5, 1], [G5, 1],
  // La gamme qui monte, puis qui redescend.
  [A4, 1], [B4, 1], [Cs5, 1], [D5, 1], [E5, 1], [F5, 1], [G5, 1], [A5, 1],
  [Bb5, 1], [A5, 1], [G5, 1], [F5, 1], [E5, 1], [D5, 1], [Cs5, 1], [E5, 1],
  // Mi ré do♯, ré.
  [E5, 2], [D5, 4], [Cs5, 2], [D5, 4],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Sautillé : les doubles croches sont courtes ; les notes longues accentuées.
  if (midi) notes.push({ midi, at: t, len: len === 1 ? 0.7 : len * 0.85, velocity: len === 1 ? 0.5 : 0.6 })
  t += len
}

export const CSARDAS: readonly SequenceNote[] = notes
