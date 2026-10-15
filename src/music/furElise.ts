import type { SequenceNote } from '@/audio/engine'

/**
 * Début de « La Lettre à Élise » (Für Elise, WoO 59) de Beethoven : la levée et les
 * 8 premières mesures, soit environ 10 secondes. Temps en doubles croches (3/8 = 6 unités).
 */

export const FUR_ELISE_SIXTEENTH = 0.19 // secondes par double croche

const [E2, A2, E3, Gs3, A3, C4, E4, Gs4, A4, B4, C5, D5, Ds5, E5] = [40, 45, 52, 56, 57, 60, 64, 68, 69, 71, 72, 74, 75, 76]

const notes: SequenceNote[] = []
const add = (at: number, midi: number, len = 1.5) => notes.push({ midi, at, len })

/** Le motif mi ré♯ mi si ré do, en doubles croches. */
function motif(at: number) {
  ;[E5, Ds5, E5, B4, D5, C5].forEach((m, i) => add(at + i, m))
}

/**
 * Mesure arpégée : une croche à la main droite sur la basse, l'arpège de la main gauche,
 * puis trois doubles croches de la main droite. Tout résonne jusqu'à la barre (pédale).
 */
function arpeggioBar(at: number, top: number, left: number[], right: number[]) {
  add(at, top, 6)
  left.forEach((m, i) => add(at + i, m, 6 - i))
  right.forEach((m, i) => add(at + 3 + i, m, 3 - i))
}

add(0, E5)
add(1, Ds5)
motif(2)
arpeggioBar(8, A4, [A2, E3, A3], [C4, E4, A4])
arpeggioBar(14, B4, [E2, E3, Gs3], [E4, Gs4, B4])
arpeggioBar(20, C5, [A2, E3, A3], [E4])
add(24, E5)
add(25, Ds5)
motif(26)
arpeggioBar(32, A4, [A2, E3, A3], [C4, E4, A4])
arpeggioBar(38, B4, [E2, E3, Gs3], [E4, C5, B4])
// Fin de phrase : le La tenu, qui s'éteint doucement.
add(44, A4, 9)
;[A2, E3, A3].forEach((m, i) => add(44 + i, m, 9 - i))

export const FUR_ELISE: readonly SequenceNote[] = notes.sort((a, b) => a.at - b.at)

/**
 * Fausse une part des notes d'un demi-ton (vers le haut ou vers le bas), au hasard :
 * `ratio` = part de mauvaises réponses (0 = morceau juste, 1 = toutes les notes fausses).
 */
export function detune(notes: readonly SequenceNote[], ratio: number, random: () => number = Math.random): SequenceNote[] {
  const count = Math.round(Math.max(0, Math.min(1, ratio)) * notes.length)
  const order = notes.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const wrong = new Set(order.slice(0, count))
  return notes.map((n, i) => (wrong.has(i) ? { ...n, midi: n.midi + (random() < 0.5 ? -1 : 1) } : { ...n }))
}
