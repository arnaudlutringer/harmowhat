import type { SequenceNote } from '@/audio/engine'

/**
 * Prélude du Te Deum (H. 146) de Marc-Antoine Charpentier, en ré majeur : le célèbre rondeau des
 * trompettes (indicatif de l'Eurovision), la levée et les 4 premières mesures, soit les 10 premières
 * secondes. Temps en noires (noire = 104). Notes relevées dans l'édition de Calebe Barros (IMSLP n° 602627).
 */

export const TE_DEUM_BEAT = 10 / 17 // la levée et 4 mesures (17 noires) en 10 s

const [A4, D5, E5, Fs5, G5, A5] = [69, 74, 76, 78, 79, 81]

/** [note, durée en noires]. */
const melody: [number, number][] = [
  [A4, 1],
  [D5, 1], [D5, 0.5], [E5, 0.5], [Fs5, 1], [D5, 1],
  [A5, 2],
  // Fa♯ pointé avec trille (commencée sur la note supérieure, à la manière baroque), puis fa♯.
  [G5, 0.25], [Fs5, 0.25], [G5, 0.25], [Fs5, 0.75], [Fs5, 0.5],
  [G5, 1], [A5, 0.5], [G5, 0.5], [Fs5, 0.5], [G5, 0.5], [A5, 1],
  [E5, 0.5], [D5, 0.5], [E5, 0.5], [Fs5, 0.5], [E5, 1], [A4, 1],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len] of melody) {
  // Détaché de trompette : chaque note un peu plus courte que sa valeur.
  notes.push({ midi, at: t, len: len * 0.85, velocity: len >= 1 ? 0.62 : 0.55 })
  t += len
}

export const TE_DEUM: readonly SequenceNote[] = notes
