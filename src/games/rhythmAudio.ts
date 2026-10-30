import { playSequence, type Playback, type SequenceNote } from '@/audio/engine'
import { INSTRUMENTS } from '@/audio/instruments'
import { rhythmNotes, type CellId } from './rhythm'

/** Décompte avant la mesure : un clic de métronome par temps. */
export const COUNT_IN = 3

const CLICK = 96
const NOTE = 76

/**
 * Joue un rythme (au piano, pour des attaques nettes) : le décompte au métronome, puis la mesure.
 * `notes` : faire entendre le rythme ; `clicks` : garder le métronome sur chaque temps pendant la mesure.
 * Renvoie la lecture et l'instant (performance.now(), en ms) où la mesure commence à l'oreille.
 */
export async function playRhythm(
  cells: readonly CellId[],
  tempo: number,
  { notes = true, clicks = false }: { notes?: boolean; clicks?: boolean } = {},
): Promise<Playback & { barStart: number; beat: number }> {
  const beat = 60 / tempo
  const seq: SequenceNote[] = []
  // Le décompte (et le métronome pendant la mesure) au clic de métronome, le rythme à l'instrument.
  for (let i = 0; i < COUNT_IN; i++) seq.push({ midi: CLICK, at: i, len: 0.15, velocity: i === 0 ? 0.6 : 0.45, click: true })
  if (clicks) for (let i = 0; i < cells.length; i++) seq.push({ midi: CLICK, at: COUNT_IN + i, len: 0.15, velocity: 0.25, click: true })
  if (notes) for (const n of rhythmNotes(cells)) seq.push({ midi: NOTE, at: COUNT_IN + n.at, len: n.len, velocity: 0.75 })
  const playback = await playSequence(seq, beat, undefined, INSTRUMENTS.piano)
  return { ...playback, barStart: playback.startedAt + COUNT_IN * beat * 1000, beat }
}
