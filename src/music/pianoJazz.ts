import type { SequenceNote } from '@/audio/engine'

/**
 * « Piano Jazz in Eb » (Holly Vose), au piano, en mi♭ majeur : la levée do mi♭ fa et les six premières
 * mesures, accords de neuvième tenus à la main droite et basse en noire pointée, noire, croche ;
 * la cinquième mesure chante fa mi♭ do, fa sol do, et la phrase se pose sur l'accord de mi♭.
 * Environ 10 secondes. Temps en croches (6/8, noire pointée = 80).
 * Notes relevées dans la partition de Holly Vose (image piano_jazz.png).
 */

export const PIANO_JAZZ_EIGHTH = 60 / 240

const [F3, G3, Ab3, Bb3, C4, D4, Eb4, F4, G4] = [53, 55, 56, 58, 60, 62, 63, 65, 67]
const [Bb1, Eb2, F2, G2, Ab2, Bb2, B2, C3] = [34, 39, 41, 43, 44, 46, 47, 48]

const PICKUP = 3

const notes: SequenceNote[] = []
const melody = (midi: number, at: number, len: number) => notes.push({ midi, at, len, velocity: 0.6 })
const chord = (midis: number[], at: number, len: number) => {
  for (const midi of midis) notes.push({ midi, at, len, velocity: 0.28 })
}
const bass = (midis: [number, number, number], bar: number) =>
  // Noire pointée, noire, croche.
  [0, 3, 5].forEach((beat, i) => notes.push({ midi: midis[i], at: bar + beat, len: i === 0 ? 2.8 : i === 1 ? 1.8 : 0.9, velocity: 0.45 }))

// Levée, au forte.
melody(C4, 0, 1)
melody(Eb4, 1, 1)
melody(F4, 2, 1)

/** Accords des mesures 1 à 4 : neuvièmes serrées, le sol en haut des deux premiers. */
const Eb69 = [Bb3, C4, Eb4, F4]
const G7sus = [C4, D4, F4]
const Cm9 = [G3, Bb3, C4, D4, Eb4]
const Bb9 = [Ab3, C4, D4, F4]

const bar = (n: number) => PICKUP + (n - 1) * 6

melody(G4, bar(1), 6)
chord(Eb69, bar(1), 6)
bass([Eb2, Eb2, F2], bar(1))

melody(G4, bar(2), 6)
chord(G7sus, bar(2), 6)
bass([G2, G2, B2], bar(2))

// Mesures 3 et 4 : accord tenu, rejoué sur la dernière croche.
chord(Cm9, bar(3), 5)
chord(Cm9, bar(3) + 5, 1)
bass([C3, C3, C3], bar(3))

chord(Bb9, bar(4), 5)
chord(Bb9, bar(4) + 5, 1)
bass([Bb2, Bb2, Bb2], bar(4))

// Mesure 5 : fa mi♭ do, fa sol do sur un accord de la♭ tenu.
;[F4, Eb4, C4, F4, G4, C4].forEach((midi, i) => melody(midi, bar(5) + i, 1))
chord([F3, Ab3, C4], bar(5), 6)
bass([Ab2, Bb2, Bb1], bar(5))

// Mesure 6 : soupir, puis l'accord de mi♭ joué deux fois, le second tenu ; mi♭ grave tenu.
chord([G3, Bb3, C4, Eb4], bar(6) + 1, 2)
chord([G3, Bb3, C4, Eb4], bar(6) + 3, 4)
notes.push({ midi: Eb2, at: bar(6), len: 7, velocity: 0.45 })

export const PIANO_JAZZ: readonly SequenceNote[] = notes
