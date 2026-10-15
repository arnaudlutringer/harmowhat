import type { SequenceNote } from '@/audio/engine'

/**
 * « Le Beau Danube bleu » (op. 314, 1867) de Johann Strauss fils, en ré majeur, à l'accordéon : le thème
 * de la première valse (ré fa♯ la | la — la' | la' — fa♯' …), avec la basse sur le premier temps et les
 * accords sur les deux autres. Seules les 10 premières secondes sont jouées (voir endings.ts).
 * Temps en noires (3/4). Notes relevées dans la transcription ABC de John Chambers (trillian.mit.edu).
 */

export const BLUE_DANUBE_BEAT = 0.33

const [Cs4, D4, E4, Fs4, A4, B4, Fs5, G5, A5, B5] = [61, 62, 64, 66, 69, 71, 78, 79, 81, 83]

/**
 * [note, durée en noires, piqué ?] : les notes aiguës répétées sont piquées (staccato).
 * La levée, puis le motif « montée, note tenue, deux notes aiguës » sur ré, puis sur la⁷.
 */
const melody: [number, number, boolean?][] = [
  [D4, 1],
  [D4, 1], [Fs4, 1], [A4, 1],
  [A4, 2], [A5, 1, true], [A5, 2, true], [Fs5, 1, true],
  [Fs5, 2, true], [D4, 1], [D4, 1], [Fs4, 1], [A4, 1],
  [A4, 2], [A5, 1, true], [A5, 2, true], [G5, 1, true],
  [G5, 2, true], [Cs4, 1], [Cs4, 1], [E4, 1], [B4, 1],
  [B4, 2], [B5, 1, true], [B5, 2, true], [G5, 1, true],
  [G5, 2, true], [Cs4, 1], [Cs4, 1], [E4, 1], [B4, 1],
  [B4, 2], [B5, 1, true], [B5, 2, true], [Fs5, 1, true],
]

/** Accords, un par mesure de valse (après la levée) : basse puis accord. */
const D = { bass: 54, chord: [62, 66, 69] }
const A7 = { bass: 57, chord: [61, 64, 67] }
const bars = [D, D, D, D, D, D, A7, A7, A7, A7, A7, A7]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len, staccato] of melody) {
  notes.push({ midi, at: t, len: staccato ? 0.6 : len * 1.05, velocity: staccato ? 0.5 : 0.6 })
  t += len
}
bars.forEach(({ bass, chord }, i) => {
  const bar = 1 + i * 3
  notes.push({ midi: bass, at: bar, len: 0.9, velocity: 0.33 })
  for (const beat of [1, 2]) for (const midi of chord) notes.push({ midi, at: bar + beat, len: 0.7, velocity: 0.18 })
})

export const BLUE_DANUBE: readonly SequenceNote[] = notes.sort((a, b) => a.at - b.at)
