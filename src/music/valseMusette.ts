import type { SequenceNote } from '@/audio/engine'

/**
 * « Une valse musette » (paroles et musique de Philippe Brédif, 2007), à l'accordéon, en do majeur :
 * la levée et la première phrase, « une valse musette, c'est pas compliqué, il suffit d'un air d'une
 * cavalière et d'un brin d'muguet », jusqu'au la tenu sur « muguet », avec la basse sur le premier temps
 * et les accords sur les deux autres. Environ 10 secondes. Temps en croches (3/4, noire = 182).
 * Notes relevées dans la partition pour accordéon de Philippe Brédif (Free-scores.com).
 */

export const VALSE_MUSETTE_EIGHTH = 30 / 182

const [C4, E4, G4, A4, B4, C5] = [60, 64, 67, 69, 71, 72]

/** Le chant : [note, durée en croches], les notes liées réunies. */
const melody: [number, number][] = [
  [C4, 1], [E4, 1], [G4, 1], [C5, 1],
  [B4, 8], [C4, 1], [E4, 1], [G4, 1], [B4, 1],
  [A4, 8], [C4, 1], [E4, 1], [G4, 1], [C5, 1],
  [B4, 2], [C4, 1], [E4, 1], [G4, 1], [B4, 1],
  [A4, 2], [C4, 1], [E4, 1], [G4, 1], [B4, 1],
  [A4, 12],
]

/** Accompagnement, une mesure par élément (après la levée) : basse puis accord. */
const C = { bass: 55, chord: [60, 64, 67] }
const Dm = { bass: 57, chord: [62, 65, 69] }
const bars = [C, C, C, C, C, C, Dm]

const PICKUP = 4

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Un peu de liaison, comme le soufflet qui ne s'arrête pas entre deux notes.
  notes.push({ midi, at: t, len: len * 1.05, velocity: 0.6 })
  t += len
}
bars.forEach(({ bass, chord }, i) => {
  const bar = PICKUP + i * 6
  notes.push({ midi: bass, at: bar, len: 1.8, velocity: 0.35 })
  for (const beat of [2, 4]) for (const midi of chord) notes.push({ midi, at: bar + beat, len: 1.4, velocity: 0.2 })
})
// Dernière mesure : basse et accord de ré mineur tenus avec le la de « muguet ».
const last = PICKUP + bars.length * 6
notes.push({ midi: Dm.bass, at: last, len: 6, velocity: 0.35 })
for (const midi of Dm.chord) notes.push({ midi, at: last, len: 6, velocity: 0.25 })

export const VALSE_MUSETTE: readonly SequenceNote[] = notes
