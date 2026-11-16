import type { SequenceNote } from '@/audio/engine'

/**
 * Trois airs pour le chœur, tous du domaine public, notes relevées dans les partitions de flutetunes.com :
 * - « L'Ode à la joie » (Beethoven, 9ᵉ symphonie, 1824), en ré majeur, la première phrase (noire = 100) ;
 * - « Douce nuit » (Gruber, 1818), en do majeur, « Stille Nacht, heilige Nacht… » (noire = 72) ;
 * - « Swing Low, Sweet Chariot » (gospel traditionnel), en sol majeur, la première phrase (noire = 112).
 * Les deux premiers une octave plus bas, dans la tessiture du chœur. Une dizaine de secondes chacun.
 */

export const ODE_TO_JOY_BEAT = 60 / 100
export const SILENT_NIGHT_BEAT = 60 / 72
export const SWING_LOW_BEAT = 60 / 112

/** [note, début, durée] en noires → notes liées, comme chantées. */
const sung = (melody: [number, number, number][]): readonly SequenceNote[] =>
  melody.map(([midi, at, len]) => ({ midi, at, len: len * 0.97, velocity: 0.5 }))

// L'Ode à la joie : fa♯ fa♯ sol la, la sol fa♯ mi, ré ré mi fa♯, fa♯ mi mi.
export const ODE_TO_JOY = sung([
  [66, 0, 1], [66, 1, 1], [67, 2, 1], [69, 3, 1], [69, 4, 1], [67, 5, 1], [66, 6, 1], [64, 7, 1],
  [62, 8, 1], [62, 9, 1], [64, 10, 1], [66, 11, 1], [66, 12, 1.5], [64, 13.5, 0.5], [64, 14, 2],
])

// Douce nuit : sol la sol mi, sol la sol mi, ré ré si, do do sol.
export const SILENT_NIGHT = sung([
  [67, 0, 0.75], [69, 0.75, 0.25], [67, 1, 0.5], [64, 1.5, 1.5], [67, 3, 0.75], [69, 3.75, 0.25], [67, 4, 0.5], [64, 4.5, 1.5],
  [74, 6, 1], [74, 7, 0.5], [71, 7.5, 1.5], [72, 9, 1], [72, 10, 0.5], [67, 10.5, 1.5],
])

// Swing Low : si sol, si sol sol mi ré, sol sol sol sol si si ré ré.
export const SWING_LOW = sung([
  [71, 0, 1], [67, 1, 3], [71, 4, 1], [67, 5, 1.5], [67, 6.5, 0.5], [64, 7, 0.5], [62, 7.5, 1.5],
  [67, 9, 0.5], [67, 9.5, 0.5], [67, 10, 0.5], [67, 10.5, 0.5], [71, 11, 0.5], [71, 11.5, 0.5], [74, 12, 1], [74, 13, 3],
])
