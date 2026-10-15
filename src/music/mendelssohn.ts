import type { SequenceNote } from '@/audio/engine'

/**
 * Concerto pour violon en mi mineur (op. 64) de Mendelssohn : l'entrée du violon solo, le grand thème
 * passionné du 1ᵉʳ mouvement (si. si | si — sol mi | mi — si sol…), de sa levée à la 8ᵉ mesure,
 * soit 10 secondes. Temps en noires (alla breve, Allegro molto appassionato).
 * Notes relevées dans la partie de violon (éd. Auer, Carl Fischer 1917, IMSLP n° 49678).
 */

export const MENDELSSOHN_BEAT = 10 / 26 // la levée (2 noires) et 6 mesures en 10 s

const [G5, A5, B5, C6, E6, Fs6, G6] = [79, 81, 83, 84, 88, 90, 91]

/** [note, durée en noires]. */
const melody: [number, number][] = [
  [B5, 1.5], [B5, 0.5],
  [B5, 2], [G5, 1], [E6, 1],
  [E6, 2], [B5, 1], [G6, 1],
  [Fs6, 1], [E6, 1], [C6, 1], [E6, 1],
  [B5, 3], [B5, 1],
  [C6, 1], [B5, 0.5], [A5, 0.5], [A5, 1], [A5, 1],
  [E6, 3], [B5, 1],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Archet lié et expressif.
  notes.push({ midi, at: t, len: len * 1.05, velocity: len >= 2 ? 0.6 : 0.52 })
  t += len
}

export const MENDELSSOHN: readonly SequenceNote[] = notes
