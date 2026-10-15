import type { SequenceNote } from '@/audio/engine'
import type { InstrumentId } from '@/audio/instruments'
import { FUR_ELISE, FUR_ELISE_SIXTEENTH } from './furElise'
import { SPRING, SPRING_BEAT } from './vivaldiSpring'

/** Musique de fin de partie : « Le Printemps » au violon, « La Lettre à Élise » sinon. */
export interface Ending {
  title: string
  composer: string
  notes: readonly SequenceNote[]
  /** Durée d'une unité de temps des notes, en secondes. */
  unit: number
}

export function endingFor(instrument: InstrumentId): Ending {
  if (instrument === 'violin') return { title: 'Le Printemps', composer: 'Vivaldi', notes: SPRING, unit: SPRING_BEAT }
  return { title: 'La Lettre à Élise', composer: 'Beethoven', notes: FUR_ELISE, unit: FUR_ELISE_SIXTEENTH }
}
