import type { SequenceNote } from '@/audio/engine'
import type { InstrumentId } from '@/audio/instruments'
import { FUR_ELISE, FUR_ELISE_SIXTEENTH } from './furElise'
import { SPRING, SPRING_BEAT } from './vivaldiSpring'
import { SKATERS, SKATERS_BEAT } from './skatersWaltz'
import { BELLA_CIAO, BELLA_CIAO_EIGHTH } from './bellaCiao'

/**
 * Musique de fin de partie : « Le Printemps » au violon, « Les Patineurs » à l'accordéon,
 * « Bella ciao » à la clarinette, « La Lettre à Élise » sinon.
 */
export interface Ending {
  title: string
  composer: string
  notes: readonly SequenceNote[]
  /** Durée d'une unité de temps des notes, en secondes. */
  unit: number
}

export function endingFor(instrument: InstrumentId): Ending {
  if (instrument === 'violin') return { title: 'Le Printemps', composer: 'Vivaldi', notes: SPRING, unit: SPRING_BEAT }
  if (instrument === 'accordion') return { title: 'Les Patineurs', composer: 'Waldteufel', notes: SKATERS, unit: SKATERS_BEAT }
  if (instrument === 'clarinet') return { title: 'Bella ciao', composer: 'chant populaire italien', notes: BELLA_CIAO, unit: BELLA_CIAO_EIGHTH }
  return { title: 'La Lettre à Élise', composer: 'Beethoven', notes: FUR_ELISE, unit: FUR_ELISE_SIXTEENTH }
}
