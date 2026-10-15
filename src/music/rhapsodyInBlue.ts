import type { SequenceNote } from '@/audio/engine'

/**
 * Rhapsody in Blue (1924) de Gershwin : le célèbre appel de clarinette qui ouvre l'œuvre, le trille
 * grave sur fa, la montée de 17 notes (de fa3 à la5), le glissando et le si♭ aigu accentué.
 * Temps en noires (Molto moderato, blanche = 80).
 * Notes relevées dans la première édition (Harms, 1924, IMSLP n° 10970), en sons réels.
 */

export const RHAPSODY_BEAT = 60 / 160

const [F3, G3] = [53, 55]
const Bb5 = 82
/** La montée de 17 notes, de fa3 à la5, dans la gamme de si♭ majeur. */
const RUN = [53, 55, 57, 58, 60, 62, 63, 65, 67, 69, 70, 72, 74, 75, 77, 79, 81]

const notes: SequenceNote[] = []
let t = 0
// Trille fa–sol, sous un point d'orgue (environ 3 secondes).
for (let i = 0; i < 24; i++) {
  notes.push({ midi: i % 2 ? G3 : F3, at: t, len: 0.4, velocity: 0.5 })
  t += 1 / 3
}
// La montée, de plus en plus vite.
RUN.forEach((midi, i) => {
  notes.push({ midi, at: t, len: 0.35, velocity: 0.45 + i * 0.01 })
  t += 0.22 - i * 0.006
})
// Le glissando : quelques demi-tons glissés jusqu'au si♭.
for (const midi of [80, 81]) {
  notes.push({ midi, at: t, len: 0.15, velocity: 0.6 })
  t += 0.08
}
// Le si♭ aigu, accentué et tenu.
notes.push({ midi: Bb5, at: t, len: 4, velocity: 0.75 })

export const RHAPSODY_IN_BLUE: readonly SequenceNote[] = notes
