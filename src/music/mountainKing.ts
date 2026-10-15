import type { SequenceNote } from '@/audio/engine'

/**
 * « Dans l'antre du roi de la montagne » (Peer Gynt, suite n° 1, op. 46) de Grieg, en si mineur : le motif
 * grave en croches piquées (si do♯ ré mi fa♯ ré fa♯…), joué deux fois. Seules les 10 premières secondes
 * sont jouées (voir endings.ts). Temps en croches (4/4, noire = 138).
 * Notes relevées dans l'édition LilyPond du Mutopia Project (GriegE/O46), une octave plus haut.
 */

export const MOUNTAIN_KING_EIGHTH = 60 / 138 / 2

const [B2, C3, Cs3, D3, E3, Es3, Fs3, A3, B3] = [47, 48, 49, 50, 52, 53, 54, 57, 59]

/** Le motif de 4 mesures, [note, durée en croches] ; les notes accentuées sont marquées. */
const phrase: [number, number, boolean?][] = [
  [B2, 1], [Cs3, 1], [D3, 1], [E3, 1], [Fs3, 1, true], [D3, 1], [Fs3, 2],
  [Es3, 1, true], [Cs3, 1], [Es3, 2], [E3, 1, true], [C3, 1], [E3, 2],
  [B2, 1], [Cs3, 1], [D3, 1], [E3, 1], [Fs3, 1, true], [D3, 1], [Fs3, 1], [B3, 1],
  [A3, 1], [Fs3, 1], [D3, 1], [Fs3, 1], [A3, 4, true],
]

const notes: SequenceNote[] = []
let t = 0
for (const [midi, len, accent] of [...phrase, ...phrase]) {
  // Staccato : chaque note brève ; la dernière note de la phrase est tenue.
  notes.push({ midi, at: t, len: len === 4 ? 3.5 : 0.6, velocity: accent ? 0.65 : 0.5 })
  t += len
}

export const MOUNTAIN_KING: readonly SequenceNote[] = notes
