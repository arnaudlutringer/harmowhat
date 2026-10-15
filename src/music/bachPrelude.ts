import type { SequenceNote } from '@/audio/engine'

/**
 * Début du Prélude de la Suite pour violoncelle seul n° 1 en sol majeur (BWV 1007) de Bach :
 * les 4 premières mesures en doubles croches, qui reviennent sans cesse sur la corde de sol à vide,
 * soit les 10 premières secondes. Temps en doubles croches (4/4 = 16 unités).
 * Notes relevées dans l'édition LilyPond du Mutopia Project (BachJS/BWV1007).
 */

export const BACH_PRELUDE_SIXTEENTH = 0.155

const [G2, D3, E3, Fs3, G3, A3, B3, C4] = [43, 50, 52, 54, 55, 57, 59, 60]

/** Chaque mesure : un motif de 8 doubles croches joué deux fois (la dernière note change à la mesure 4). */
const bars: number[][] = [
  [G2, D3, B3, A3, B3, D3, B3, D3],
  [G2, E3, C4, B3, C4, E3, C4, E3],
  [G2, Fs3, C4, B3, C4, Fs3, C4, Fs3],
  [G2, G3, B3, A3, B3, G3, B3, G3],
]

const notes: SequenceNote[] = []
bars.forEach((motif, bar) => {
  const line = [...motif, ...motif]
  if (bar === 3) line[15] = Fs3
  // Les notes résonnent un peu les unes sur les autres, comme sur les cordes à vide.
  line.forEach((midi, i) => notes.push({ midi, at: bar * 16 + i, len: 1.6, velocity: i % 8 === 0 ? 0.6 : 0.48 }))
})

export const BACH_PRELUDE: readonly SequenceNote[] = notes
