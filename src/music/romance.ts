import type { SequenceNote } from '@/audio/engine'

/**
 * Début de la « Romance anonyme » (« Jeux interdits », étude espagnole de la fin du XIXᵉ siècle),
 * en mi mineur, pour guitare seule : la mélodie sur la chanterelle, deux notes d'arpège à chaque temps
 * (triolets) et la basse sur le premier temps. La première phrase, puis la réponse qui se pose sur le mi.
 * Environ 10 secondes. Temps en noires (3/4).
 */

export const ROMANCE_BEAT = 0.42 // secondes par noire

const [E2, B2, E4, Fs4, G4, A4, B4, C5, Ds5] = [40, 47, 64, 66, 67, 69, 71, 72, 75]
const [A3, B3, G3] = [57, 59, 55]

/** Une mesure : la mélodie (une note par temps) sur un accord (basse et notes d'arpège). */
const Em = { bass: E2, arpeggio: [B3, G3] }
const B7 = { bass: B2, arpeggio: [B3, A3] }
const bars: { melody: number[]; chord: typeof Em }[] = [
  { melody: [B4, B4, B4], chord: Em },
  { melody: [B4, A4, G4], chord: Em },
  { melody: [G4, Fs4, E4], chord: Em },
  { melody: [E4, G4, B4], chord: Em },
  { melody: [B4, C5, B4], chord: B7 },
  { melody: [Ds5, C5, B4], chord: B7 },
  { melody: [B4, A4, G4], chord: Em },
  { melody: [G4, Fs4, E4], chord: Em },
]

const notes: SequenceNote[] = []
bars.forEach(({ melody, chord }, i) => {
  const bar = i * 3
  const last = i === bars.length - 1
  // La basse résonne toute la mesure (et plus longtemps à la fin).
  notes.push({ midi: chord.bass, at: bar, len: last ? 4 : 3, velocity: 0.45 })
  melody.forEach((midi, beat) => {
    const at = bar + beat
    const final = last && beat === 2
    notes.push({ midi, at, len: final ? 2 : 1.1, velocity: 0.6 })
    // Triolet : la note de mélodie, puis les deux notes d'arpège.
    if (!final) chord.arpeggio.forEach((m, k) => notes.push({ midi: m, at: at + (k + 1) / 3, len: 0.8, velocity: 0.3 }))
  })
})

export const ROMANCE: readonly SequenceNote[] = notes
