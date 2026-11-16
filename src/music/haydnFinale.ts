import type { SequenceNote } from '@/audio/engine'

/**
 * Finale (Allegro) du Concerto pour trompette de Haydn (Hob. VIIe:1, 1796, domaine public), en mi♭ majeur :
 * l'entrée de la trompette solo, le thème du rondo jusqu'au si♭ qui conclut la phrase. Environ 10 secondes.
 * Temps en noires (2/4, noire = 138). Notes relevées dans la partie de trompette du fichier MIDI de Michel
 * Rondeau (IMSLP n° 226902, WIMA, licence CC BY 3.0), rythmes arrondis à la double croche.
 */

export const HAYDN_FINALE_BEAT = 60 / 138

const [Bb4, C5, D5, Eb5, F5, G5, Ab5] = [70, 72, 74, 75, 77, 79, 80]

/** [note, début, durée], en noires. */
const melody: [number, number, number][] = [
  // Si♭ mi♭, do mi♭, ré fa si♭ ré, mi♭ … mi♭ (deux fois).
  [Bb4, 0, 1.5], [Eb5, 1.5, 0.5], [C5, 2, 1.5], [Eb5, 3.5, 0.5],
  [D5, 4, 0.5], [F5, 4.5, 0.5], [Bb4, 5, 0.5], [D5, 5.5, 0.5], [Eb5, 6, 1], [Eb5, 7.5, 0.5],
  [D5, 8, 0.5], [F5, 8.5, 0.5], [Bb4, 9, 0.5], [D5, 9.5, 0.5], [Eb5, 10, 1], [Eb5, 11.5, 0.5],
  // Les doubles croches, puis mi♭ fa sol.
  [D5, 12, 0.25], [Eb5, 12.25, 0.25], [F5, 12.5, 0.25], [D5, 12.75, 0.25], [Bb4, 13, 0.25], [C5, 13.25, 0.25], [D5, 13.5, 0.25], [Bb4, 13.75, 0.25],
  [Eb5, 14, 1.5], [F5, 15.5, 0.25], [G5, 15.75, 0.25],
  // La♭ la♭ sol sol fa fa mi♭ mi♭, puis la descente vers le si♭.
  [Ab5, 16, 0.5], [Ab5, 16.5, 0.5], [G5, 17, 0.5], [G5, 17.5, 0.5], [F5, 18, 0.5], [F5, 18.5, 0.5], [Eb5, 19, 0.5], [Eb5, 19.5, 0.5],
  [D5, 20, 0.25], [Eb5, 20.25, 0.25], [F5, 20.5, 0.25], [G5, 20.75, 0.25], [F5, 21, 0.25], [Eb5, 21.25, 0.25], [D5, 21.5, 0.25], [C5, 21.75, 0.25],
  [Bb4, 22, 1],
]

export const HAYDN_FINALE: readonly SequenceNote[] = melody.map(([midi, at, len]) => ({ midi, at, len: len * 0.88, velocity: len < 0.5 ? 0.5 : 0.58 }))
