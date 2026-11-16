import type { SequenceNote } from '@/audio/engine'

/**
 * « Danny Boy » (Londonderry Air, air traditionnel irlandais, domaine public), à la flûte, en fa majeur :
 * « Oh Danny boy, the pipes, the pipes are calling, from glen to glen… », jusqu'au sol qui suspend la phrase.
 * Environ 10 secondes. Temps en noires (noire = 88). Notes relevées dans la partition de flutetunes.com.
 */

export const DANNY_BOY_BEAT = 60 / 88

const [D4, E4, F4, G4, A4, Bb4, C5, D5] = [62, 64, 65, 67, 69, 70, 72, 74]

/** [note, début, durée], en noires. */
const melody: [number, number, number][] = [
  // Oh Danny boy, the pipes, the pipes are calling…
  [E4, 0, 0.5], [F4, 0.5, 0.5], [G4, 1, 0.5], [A4, 1.5, 1.5], [G4, 3, 0.5], [A4, 3.5, 0.5], [D5, 4, 0.5], [C5, 4.5, 0.5],
  [A4, 5, 0.5], [G4, 5.5, 0.5], [F4, 6, 0.5], [D4, 6.5, 1.5],
  // … from glen to glen, and down the mountain side.
  [F4, 8, 0.5], [A4, 8.5, 0.5], [Bb4, 9, 0.5], [C5, 9.5, 1.5], [D5, 11, 0.5], [C5, 11.5, 0.5], [A4, 12, 0.5], [F4, 12.5, 0.5], [A4, 13, 0.5],
  [G4, 13.5, 1.2],
]

export const DANNY_BOY: readonly SequenceNote[] = melody.map(([midi, at, len]) => ({ midi, at, len: len * 0.95, velocity: 0.5 }))
