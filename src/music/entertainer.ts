import type { SequenceNote } from '@/audio/engine'

/**
 * « The Entertainer » (Scott Joplin, 1902, domaine public), à la trompette, en do majeur (son réel) :
 * à partir de la mesure 4, la fin de l'introduction (sol, sol aigu), la levée ré ré♯, puis le célèbre
 * thème jusqu'au do pointé. Un peu moins de 10 secondes. Temps en doubles croches (2/4, noire = 60).
 * Notes relevées dans la partition pour trompette en si♭ de Virtual Sheet Music (écrite en ré majeur,
 * transposée ici d'un ton plus bas).
 */

export const ENTERTAINER_SIXTEENTH = 60 / 60 / 4

const [D4, Ds4, E4, G4, B4, C5, D5, Ds5, E5, G5] = [62, 63, 64, 67, 71, 72, 74, 75, 76, 79]

/** [note, durée en doubles croches]. */
const melody: [number, number][] = [
  // Mesure 4 : fin de l'introduction, puis la levée.
  [G4, 4], [G5, 2], [D4, 1], [Ds4, 1],
  // Le thème : mi do mi do mi do (tenu)… do ré ré♯, mi do ré mi (lié) si ré, do pointé.
  [E4, 1], [C5, 2], [E4, 1], [C5, 2], [E4, 1], [C5, 6],
  [C5, 1], [D5, 1], [Ds5, 1],
  [E5, 1], [C5, 1], [D5, 1], [E5, 2], [B4, 1], [D5, 2],
  [C5, 6],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Détaché, à la manière du ragtime ; la levée est piano.
  notes.push({ midi, at: t, len: len * 0.9, velocity: midi < E4 ? 0.45 : 0.55 })
  t += len
}

export const ENTERTAINER: readonly SequenceNote[] = notes
