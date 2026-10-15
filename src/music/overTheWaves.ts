import type { SequenceNote } from '@/audio/engine'

/**
 * « Sobre las olas » (Sur les vagues, 1888) de Juventino Rosas, en sol majeur, façon bal musette à
 * l'accordéon : le thème (si — la♯ si ré | sol — sol fa♯ sol…), avec la basse sur le premier temps et
 * les accords sur les deux autres. Seules les 10 premières secondes sont jouées (voir endings.ts).
 * Temps en noires (3/4). Notes relevées dans la transcription ABC de John Chambers (trillian.mit.edu).
 */

export const OVER_THE_WAVES_BEAT = 0.3

const [B3, C4, D4, Es4, Fs4, G4, A4, As3] = [59, 60, 62, 65, 66, 67, 69, 58]

/** [note, durée en noires], 0 étant un silence ; une ligne par groupe de deux mesures. */
const melody: [number, number][] = [
  [B3, 3], [As3, 1], [B3, 1], [D4, 1],
  [G4, 4], [Fs4, 1], [G4, 1],
  [A4, 1], [G4, 1], [Fs4, 1], [G4, 1], [B3, 1], [D4, 1],
  [Fs4, 3], [0, 3],
  [C4, 3], [B3, 1], [C4, 1], [D4, 1],
  [Fs4, 4], [Es4, 1], [Fs4, 1],
  [G4, 1], [Fs4, 1], [Es4, 1], [Fs4, 1], [C4, 1], [Fs4, 1],
  [B3, 3], [0, 3],
]

/** Accords, un par mesure de valse : basse puis accord. */
const G = { bass: 55, chord: [62, 67, 71] }
const D7 = { bass: 57, chord: [60, 66, 69] }
const Am = { bass: 57, chord: [60, 64, 69] }
const bars = [G, G, G, G, G, G, D7, D7, Am, Am, D7, D7, D7, D7, G, G]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  if (midi) notes.push({ midi, at: t, len: len * 1.05, velocity: 0.6 })
  t += len
}
bars.forEach(({ bass, chord }, i) => {
  const bar = i * 3
  notes.push({ midi: bass, at: bar, len: 0.9, velocity: 0.33 })
  for (const beat of [1, 2]) for (const midi of chord) notes.push({ midi, at: bar + beat, len: 0.7, velocity: 0.18 })
})

export const OVER_THE_WAVES: readonly SequenceNote[] = notes.sort((a, b) => a.at - b.at)
