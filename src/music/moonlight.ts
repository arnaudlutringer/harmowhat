import type { SequenceNote } from '@/audio/engine'

/**
 * Début du 3ᵉ mouvement (Presto agitato) de la « Sonate au clair de lune » (op. 27 n° 2) de Beethoven,
 * en do♯ mineur : les mesures 1 à 6, trois vagues d'arpèges en doubles croches qui montent chacune
 * vers deux accords sforzando, sur une basse en croches. Environ 10 secondes. Temps en doubles croches.
 * Notes relevées dans l'édition Humdrum de Craig Sapp (github.com/craigsapp/beethoven-piano-sonatas).
 */

export const MOONLIGHT_SIXTEENTH = 60 / 154 / 4 // noire = 154

const notes: SequenceNote[] = []
const add = (at: number, midi: number, len: number, velocity: number) => notes.push({ midi, at, len, velocity })

/**
 * Une vague de deux mesures (32 doubles croches) : `tones` = les notes de l'accord, de la plus grave
 * à la plus aiguë (10 notes). La main droite les égrène par groupes de quatre en montant, puis frappe
 * deux accords ; la main gauche alterne la basse et le sol♯ grave.
 */
function wave(at: number, tones: number[], bass: number) {
  // Main droite : un demi-soupir, puis des groupes « haut, bas, milieu, haut » qui montent.
  tones.slice(0, 3).forEach((m, i) => add(at + 1 + i, m, 1.2, 0.4))
  for (let k = 1; k <= 6; k++) {
    ;[tones[k + 2], tones[k], tones[k + 1], tones[k + 2]].forEach((m, i) => add(at + 4 * k + i, m, 1.2, 0.42))
  }
  // Main gauche : basse et sol♯ en croches.
  for (let e = 0; e < 14; e++) add(at + 2 * e, e % 2 ? 44 : bass, 2, 0.35)
  // Deux accords sforzando (avec la basse doublée à l'octave sur le premier).
  const chord = tones.slice(6, 10)
  for (const [i, at2] of [at + 28, at + 30].entries()) {
    const last = at === 64 && i === 1
    chord.forEach((m) => add(at2, m, last ? 8 : 1.5, 0.85))
    if (i === 0) [bass, bass + 12].forEach((m) => add(at2, m, 1.5, 0.7))
    else add(at2, 44, last ? 8 : 1.5, 0.6)
  }
}

// Do♯ mineur sur do♯, puis sur si♯, puis sur si.
wave(0, [44, 49, 52, 56, 61, 64, 68, 73, 76, 80], 37)
wave(32, [44, 48, 51, 56, 60, 63, 68, 72, 75, 80], 36)
wave(64, [49, 53, 56, 61, 65, 68, 73, 77, 80, 85], 35)

export const MOONLIGHT: readonly SequenceNote[] = notes.sort((a, b) => a.at - b.at)
