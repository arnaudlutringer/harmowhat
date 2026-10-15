import type { SequenceNote } from '@/audio/engine'

/**
 * Début du « Rondo alla turca » (Marche turque, sonate K. 331, 3ᵉ mouvement) de Mozart, en la mineur :
 * la levée et les 8 premières mesures, jusqu'à la cadence sur le mi. Environ 9 secondes.
 * Temps en doubles croches (2/4 = 8 unités). Notes relevées dans l'édition Humdrum de Craig Sapp
 * (github.com/craigsapp/mozart-piano-sonatas).
 */

export const TURKISH_MARCH_SIXTEENTH = 60 / 112 / 4 // noire = 112

const [A3, B2, B3, C4, E3, E4] = [57, 47, 59, 60, 52, 64]
const [Gs4, A4, B4, C5, D5, Ds5, E5, F5, Fs5, G5, Gs5, A5, B5, C6] = [68, 69, 71, 72, 74, 75, 76, 77, 78, 79, 80, 81, 83, 84]

const notes: SequenceNote[] = []
/** Main droite (mélodie) et main gauche (accompagnement) : note ou accord, temps et durée en doubles croches. */
const right = (at: number, midis: number[], len = 1) => midis.forEach((midi) => notes.push({ midi, at, len: len * 1.1, velocity: 0.5 }))
const left = (at: number, midis: number[], len = 2) => midis.forEach((midi) => notes.push({ midi, at, len, velocity: 0.33 }))
/** Une suite de doubles croches à la main droite. */
const run = (at: number, midis: number[]) => midis.forEach((m, i) => right(at + i, [m]))
/** Accompagnement « basse, accord, accord, accord » en croches. */
const oomPah = (at: number, bass: number, chord: number[], last = chord) => {
  left(at, [bass])
  left(at + 2, chord)
  left(at + 4, chord)
  left(at + 6, last)
}
/** Petites notes (appoggiatures) juste avant le temps. */
const grace = (at: number) => [G5, A5].forEach((m, i) => notes.push({ midi: m, at: at - 0.5 + i * 0.25, len: 0.3, velocity: 0.45 }))

// Levée : si la sol♯ la.
run(0, [B4, A4, Gs4, A4])
// Mesures 1 à 4 : le thème qui monte, de do en mi puis jusqu'au do aigu.
right(4, [C5], 2)
run(8, [D5, C5, B4, C5])
oomPah(4, A3, [C4, E4])
right(12, [E5], 2)
run(16, [F5, E5, Ds5, E5])
oomPah(12, A3, [C4, E4])
run(20, [B5, A5, Gs5, A5, B5, A5, Gs5, A5])
left(20, [A3])
left(22, [C4, E4])
left(24, [A3])
left(26, [C4, E4])
right(28, [C6], 4)
right(32, [A5], 2)
right(34, [C6], 2)
oomPah(28, A3, [C4, E4])
// Mesures 5 à 8 : les appoggiatures, les tierces, puis la cadence sur le mi.
for (const at of [36, 44, 52]) {
  grace(at)
  right(at, [B5], 2)
  right(at + 2, [Fs5, A5], 2)
  right(at + 4, [E5, G5], 2)
  right(at + 6, at === 52 ? [Ds5, Fs5] : [Fs5, A5], 2)
}
oomPah(36, E3, [B3, E4])
oomPah(44, E3, [B3, E4])
left(52, [E3])
left(54, [B3, E4])
left(56, [B2])
left(58, [B3])
right(60, [E5], 7)
left(60, [E3], 7)

export const TURKISH_MARCH: readonly SequenceNote[] = notes.sort((a, b) => a.at - b.at)
