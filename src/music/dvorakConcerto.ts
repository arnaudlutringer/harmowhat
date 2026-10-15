import type { SequenceNote } from '@/audio/engine'

/**
 * Début du Concerto pour violoncelle en si mineur, op. 104 de Dvořák : le thème qui ouvre le
 * 1ᵉʳ mouvement (Allegro), confié aux deux clarinettes à l'unisson, joué ici au violoncelle.
 * Les 5 premières mesures, soit les 10 premières secondes. Temps en noires (4/4, noire = 116).
 * Notes relevées dans la partition d'orchestre (Simrock 1896, IMSLP n° 08476), clarinettes en la
 * transposées en sons réels (une tierce mineure plus bas).
 */

export const DVORAK_BEAT = 60 / 116

const [D3, E3, Fs3, G3, A3, B3, Cs4, D4] = [50, 52, 54, 55, 57, 59, 61, 62]

/** [note, durée en noires]. */
const melody: [number, number][] = [
  [B3, 1.5], [Cs4, 0.25], [D4, 0.25], [B3, 2],
  [B3, 1.5], [A3, 0.25], [Fs3, 0.25], [B3, 2],
  [B3, 0.75], [Cs4, 0.25], [D4, 0.75], [Cs4, 0.25], [B3, 1], [A3, 1],
  [G3, 1], [Fs3, 1], [E3, 1], [D3, 1],
  [Fs3, 4],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  notes.push({ midi, at: t, len: len * 1.05, velocity: 0.5 })
  t += len
}

export const DVORAK_CONCERTO: readonly SequenceNote[] = notes
