import type { SequenceNote } from '@/audio/engine'

/**
 * Début de la valse « Les Patineurs » (op. 183, 1882) d'Émile Waldteufel, en sol majeur, façon bal musette
 * à l'accordéon : le premier thème, avec la basse sur le premier temps et les accords sur les deux autres
 * (« poum-tchac-tchac »). Environ 10 secondes. Temps en noires (3/4).
 */

export const SKATERS_BEAT = 0.23 // secondes par noire (Tempo di valse)

const [A4, B4, C5, D5, E5, Fs5, G4, G5, A5] = [69, 71, 72, 74, 76, 78, 67, 79, 81]

/** Le thème : [note, durée en noires]. */
const theme: [number, number][] = [
  [B4, 3],
  [D5, 2], [E5, 1],
  [E5, 6],
  [C5, 3],
  [E5, 2], [Fs5, 1],
  [Fs5, 6],
  [A5, 3],
  [G5, 2], [B4, 1],
  [D5, 3],
  [C5, 2], [B4, 1],
  [B4, 3],
  [A4, 3],
  [G4, 6],
]

/** Accompagnement, une mesure par élément : basse puis accord. */
const G = { bass: 55, chord: [59, 62, 67] }
const D7 = { bass: 54, chord: [57, 60, 66] }
const Em = { bass: 55, chord: [59, 64, 67] }
const Am = { bass: 57, chord: [57, 60, 64] }
const D = { bass: 54, chord: [57, 62, 66] }
const bars = [G, G, D7, D7, D7, D7, G, G, Em, Em, Am, Am, D, D7]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of theme) {
  // Un peu de liaison, comme le soufflet qui ne s'arrête pas entre deux notes.
  notes.push({ midi, at: t, len: len * 1.1, velocity: 0.6 })
  t += len
}
bars.forEach(({ bass, chord }, i) => {
  const bar = i * 3
  notes.push({ midi: bass, at: bar, len: 0.9, velocity: 0.35 })
  for (const beat of [1, 2]) for (const midi of chord) notes.push({ midi, at: bar + beat, len: 0.7, velocity: 0.2 })
})
// Dernière mesure : basse et accord de sol tenus avec la dernière note.
const last = bars.length * 3
notes.push({ midi: G.bass, at: last, len: 3, velocity: 0.35 })
for (const midi of G.chord) notes.push({ midi, at: last, len: 3, velocity: 0.25 })

export const SKATERS: readonly SequenceNote[] = notes
