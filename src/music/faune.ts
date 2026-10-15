import type { SequenceNote } from '@/audio/engine'

/**
 * Prélude à l'après-midi d'un faune de Debussy : le célèbre solo de flûte qui ouvre l'œuvre
 * (do♯ tenu, descente chromatique jusqu'au sol, puis remontée), joué deux fois comme dans les
 * deux premières mesures. Temps en croches (9/8, Très modéré).
 * Notes relevées dans la partie de flûte (Fromont 1895, IMSLP n° 37660).
 */

export const FAUNE_EIGHTH = 10 / 18 // deux mesures de 9/8 en 10 s

const [G4, Gs4, A4, As4, B4, C5, Cs5] = [67, 68, 69, 70, 71, 72, 73]

/** Une mesure : do♯ tenu, descente chromatique (dont un triolet) jusqu'au sol, puis remontée vers do♯. */
const bar: [number, number][] = [
  [Cs5, 3],
  [C5, 0.5], [B4, 0.5], [As4, 1 / 3], [A4, 1 / 3], [Gs4, 1 / 3], [G4, 1],
  [A4, 1], [As4, 0.5], [B4, 0.5], [Cs5, 1],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of [...bar, ...bar]) {
  // Très lié et doux.
  notes.push({ midi, at: t, len: len * 1.15, velocity: 0.45 })
  t += len
}

export const FAUNE: readonly SequenceNote[] = notes
