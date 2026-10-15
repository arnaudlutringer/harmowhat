import { ref } from 'vue'
import type { SequenceNote } from '@/audio/engine'
import type { InstrumentId } from '@/audio/instruments'
import { FUR_ELISE, FUR_ELISE_SIXTEENTH } from './furElise'
import { MOONLIGHT, MOONLIGHT_SIXTEENTH } from './moonlight'
import { TURKISH_MARCH, TURKISH_MARCH_SIXTEENTH } from './turkishMarch'
import { SPRING, SPRING_BEAT } from './vivaldiSpring'
import { SKATERS, SKATERS_BEAT } from './skatersWaltz'
import { BELLA_CIAO, BELLA_CIAO_EIGHTH } from './bellaCiao'
import { ROMANCE, ROMANCE_BEAT } from './romance'

/**
 * Musiques de fin de partie : chaque instrument propose un ou plusieurs morceaux (une dizaine de
 * secondes chacun), et le joueur choisit le sien dans les Paramètres.
 */
export interface Ending {
  id: EndingId
  title: string
  composer: string
  notes: readonly SequenceNote[]
  /** Durée d'une unité de temps des notes, en secondes. */
  unit: number
}

export type EndingId = 'elise' | 'moonlight' | 'turkish-march' | 'spring' | 'skaters' | 'bella-ciao' | 'romance'

export const ENDINGS: Record<EndingId, Ending> = {
  elise: { id: 'elise', title: 'La Lettre à Élise', composer: 'Beethoven', notes: FUR_ELISE, unit: FUR_ELISE_SIXTEENTH },
  moonlight: { id: 'moonlight', title: 'Sonate au clair de lune (3ᵉ mvt)', composer: 'Beethoven', notes: MOONLIGHT, unit: MOONLIGHT_SIXTEENTH },
  'turkish-march': {
    id: 'turkish-march',
    title: 'Marche turque',
    composer: 'Mozart',
    notes: TURKISH_MARCH,
    unit: TURKISH_MARCH_SIXTEENTH,
  },
  spring: { id: 'spring', title: 'Le Printemps', composer: 'Vivaldi', notes: SPRING, unit: SPRING_BEAT },
  skaters: { id: 'skaters', title: 'Les Patineurs', composer: 'Waldteufel', notes: SKATERS, unit: SKATERS_BEAT },
  'bella-ciao': { id: 'bella-ciao', title: 'Bella ciao', composer: 'chant populaire italien', notes: BELLA_CIAO, unit: BELLA_CIAO_EIGHTH },
  romance: { id: 'romance', title: 'Romance (Jeux interdits)', composer: 'Anonyme', notes: ROMANCE, unit: ROMANCE_BEAT },
}

/** Morceaux proposés pour chaque instrument ; le premier est celui par défaut. */
export const INSTRUMENT_ENDINGS: Record<InstrumentId, EndingId[]> = {
  piano: ['elise', 'moonlight', 'turkish-march'],
  violin: ['spring'],
  cello: ['elise'],
  clarinet: ['bella-ciao'],
  trumpet: ['elise'],
  accordion: ['skaters'],
  guitar: ['romance'],
}

export function endingsFor(instrument: InstrumentId): Ending[] {
  return INSTRUMENT_ENDINGS[instrument].map((id) => ENDINGS[id])
}

const STORAGE_KEY = 'harmowhat.endings'

function loadChoices(): Partial<Record<InstrumentId, EndingId>> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

/** Morceau choisi par le joueur pour chaque instrument (réglage mémorisé sur l'appareil). */
export const chosenEndings = ref(loadChoices())

/** Morceau joué en fin de partie : celui choisi pour l'instrument s'il lui est proposé, sinon le premier. */
export function endingFor(instrument: InstrumentId, choices = chosenEndings.value): Ending {
  const allowed = INSTRUMENT_ENDINGS[instrument]
  const chosen = choices[instrument]
  return ENDINGS[chosen && allowed.includes(chosen) ? chosen : allowed[0]]
}

export function chooseEnding(instrument: InstrumentId, id: EndingId): void {
  if (!INSTRUMENT_ENDINGS[instrument].includes(id)) return
  chosenEndings.value = { ...chosenEndings.value, [instrument]: id }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chosenEndings.value))
  } catch {
    // Stockage indisponible : le choix vaut pour cette session.
  }
}
