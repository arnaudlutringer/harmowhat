import type { SequenceNote } from '@/audio/engine'

/**
 * « Asturias (Leyenda) » (Suite española, op. 47 n° 5) d'Albéniz, dans sa version pour guitare en mi mineur :
 * l'ostinato du début, en doubles croches, qui alterne la pédale de si (corde à vide) et la mélodie
 * jouée au pouce. Seules les 10 premières secondes sont jouées (voir endings.ts).
 * Temps en doubles croches (3/4, Allegro ma non troppo). Notes relevées dans l'arrangement de
 * Stefan Apke (IMSLP n° 495190, CC BY-SA 4.0), en sons réels (une octave sous l'écriture).
 */

export const ASTURIAS_SIXTEENTH = 0.13

const [E3, G3, A3, B3, C4] = [52, 55, 57, 59, 60]

/** Une mesure : trois temps de quatre doubles croches, la pédale de si une note sur deux. */
const bar = [E3, B3, B3, B3, C4, B3, A3, B3, B3, B3, G3, B3]

const notes: SequenceNote[] = []
for (let b = 0; b < 6; b++) {
  bar.forEach((midi, i) => {
    const at = b * 12 + i
    // La première note de chaque temps, au pouce, ressort et résonne un peu plus.
    const accent = i % 4 === 0
    notes.push({ midi, at, len: accent ? 2 : 1.2, velocity: accent ? 0.62 : 0.45 })
  })
}

export const ASTURIAS: readonly SequenceNote[] = notes
