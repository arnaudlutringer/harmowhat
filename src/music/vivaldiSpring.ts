import type { SequenceNote } from '@/audio/engine'

/**
 * Début du « Printemps » (Les Quatre Saisons, concerto RV 269, 1er mouvement) de Vivaldi,
 * partie de violon seule : la levée, le thème joué deux fois, puis la petite phrase et son écho
 * (joué plus doucement), en mi majeur. Environ 10 secondes. Temps en noires (4/4).
 */

export const SPRING_BEAT = 0.58 // secondes par noire (Allegro)

const [B4, Ds5, E5, Fs5, Gs5, A5, B5] = [71, 75, 76, 78, 80, 81, 83]

const notes: SequenceNote[] = []
let t = 0
/** Ajoute des notes à la suite : [note, durée en noires], une note à 0 étant un silence. */
function play(steps: [number, number][], velocity?: number) {
  for (const [midi, len] of steps) {
    // Un peu de liaison : chaque note tient légèrement sur la suivante.
    if (midi) notes.push({ midi, at: t, len: len * 1.15, ...(velocity ? { velocity } : {}) })
    t += len
  }
}

const theme: [number, number][] = [[Gs5, 0.5], [Gs5, 0.5], [Gs5, 0.5], [Fs5, 0.25], [E5, 0.25], [B5, 1.5], [B5, 0.25], [A5, 0.25]]
const phrase: [number, number][] = [[Gs5, 0.5], [A5, 0.25], [B5, 0.25], [A5, 0.5], [Gs5, 0.5], [Fs5, 1]]

play([[E5, 0.5]])
play(theme)
play(theme)
play([...phrase, [0, 0.5], [B4, 0.5]])
// L'écho, plus doux, puis le retour sur le mi.
play(phrase, 0.35)
play([[Ds5, 0.5], [E5, 1.5]], 0.45)

export const SPRING: readonly SequenceNote[] = notes
