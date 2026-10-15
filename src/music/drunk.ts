import type { SequenceNote } from '@/audio/engine'

/**
 * Musique de fin « jouée par un musicien éméché » : plus le joueur a fait d'erreurs,
 * plus le morceau est mal joué, tout en restant reconnaissable.
 *
 * `ratio` = part de mauvaises réponses (0 = morceau joué proprement, 1 = musicien ivre).
 * Les défauts, tous proportionnels à `ratio` :
 * - le tempo titube : le musicien accélère, ralentit, et marque des hésitations ;
 * - les notes sont tenues trop longtemps ou lâchées trop tôt ;
 * - des notes sont fausses (un ou deux demi-tons à côté) ;
 * - des doigts accrochent les touches voisines (plusieurs notes en même temps) ;
 * - certaines notes bégaient (rejouées aussitôt), d'autres sont oubliées ;
 * - les nuances partent dans tous les sens.
 */
export function drunk(notes: readonly SequenceNote[], ratio: number, random: () => number = Math.random): SequenceNote[] {
  const r = Math.max(0, Math.min(1, ratio))
  if (r === 0) return notes.map((n) => ({ ...n }))
  const chance = (p: number) => random() < p * r
  const spread = (amount: number) => (random() * 2 - 1) * amount * r
  const step = () => (random() < 0.5 ? -1 : 1) * (random() < 0.75 ? 1 : 2)

  // Tempo qui titube : un décalage qui dérive d'un temps à l'autre, avec des hésitations.
  // Les notes jouées ensemble (accords) gardent le même décalage.
  const onsets = [...new Set(notes.map((n) => n.at))].sort((a, b) => a - b)
  const shift = new Map<number, number>()
  let drift = 0
  let previous = 0
  for (const at of onsets) {
    const gap = at - previous
    previous = at
    drift += spread(0.45) * Math.min(1, gap + 0.3)
    if (chance(0.12)) drift += 0.6 + random() * 1.2 // il cherche la note suivante
    drift = Math.max(drift, -at) // jamais avant le début
    shift.set(at, drift)
  }

  const out: SequenceNote[] = []
  for (const n of notes) {
    if (chance(0.06)) continue // note oubliée
    const at = Math.max(0, n.at + (shift.get(n.at) ?? 0) + spread(0.12))
    // Tenue approximative : parfois écourtée, parfois beaucoup trop longue.
    const len = Math.max(0.25, n.len * (chance(0.15) ? 2.5 : 1 + spread(0.6)))
    const velocity = Math.max(0.15, Math.min(1, (n.velocity ?? 0.55) * (chance(0.1) ? 1.6 : 1 + spread(0.4))))
    const midi = chance(0.6) ? n.midi + step() : n.midi
    out.push({ midi, at, len, velocity })
    // Doigt qui accroche la touche voisine.
    if (chance(0.35)) out.push({ midi: n.midi + step(), at: at + random() * 0.15 * r, len: len * 0.8, velocity: velocity * 0.7 })
    // Note qui bégaie.
    if (chance(0.1)) out.push({ midi, at: at + 0.4 + random() * 0.4, len: len * 0.6, velocity: velocity * 0.8 })
  }
  return out.sort((a, b) => a.at - b.at)
}
