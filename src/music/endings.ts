import { ref } from 'vue'
import type { SequenceNote } from '@/audio/engine'
import type { InstrumentId } from '@/audio/instruments'
import { FUR_ELISE, FUR_ELISE_SIXTEENTH } from './furElise'
import { MOONLIGHT, MOONLIGHT_SIXTEENTH } from './moonlight'
import { TURKISH_MARCH, TURKISH_MARCH_SIXTEENTH } from './turkishMarch'
import { BACH_PRELUDE, BACH_PRELUDE_SIXTEENTH } from './bachPrelude'
import { TAPS, TAPS_EIGHTH } from './taps'
import { SWAN, SWAN_BEAT } from './swan'
import { DVORAK_CONCERTO, DVORAK_BEAT } from './dvorakConcerto'
import { TE_DEUM, TE_DEUM_BEAT } from './teDeum'
import { OVER_THE_WAVES, OVER_THE_WAVES_BEAT } from './overTheWaves'
import { BLUE_DANUBE, BLUE_DANUBE_BEAT } from './blueDanube'
import { MORNING_MOOD, MORNING_EIGHTH } from './morningMood'
import { FAUNE, FAUNE_EIGHTH } from './faune'
import { BADINERIE, BADINERIE_SIXTEENTH } from './badinerie'
import { RISING_SUN, RISING_SUN_BEAT } from './risingSun'
import { PAGANINI_24, PAGANINI_SIXTEENTH } from './paganini24'
import { MOUNTAIN_KING, MOUNTAIN_KING_EIGHTH } from './mountainKing'
import { SPRING, SPRING_BEAT } from './vivaldiSpring'
import { SKATERS, SKATERS_BEAT } from './skatersWaltz'
import { BELLA_CIAO, BELLA_CIAO_EIGHTH } from './bellaCiao'
import { ROMANCE, ROMANCE_BEAT } from './romance'

/**
 * Musiques de fin de partie : chaque instrument propose un ou plusieurs morceaux (les 10 premières
 * secondes de chacun), et le joueur choisit le sien dans les Paramètres.
 */

/** Durée maximale d'une musique de fin, en secondes. */
export const ENDING_SECONDS = 10

/** Garde les 10 premières secondes : les notes qui commencent après sont retirées, celles qui débordent raccourcies. */
export function firstSeconds(notes: readonly SequenceNote[], unit: number, seconds = ENDING_SECONDS): SequenceNote[] {
  const end = seconds / unit
  return notes.filter((n) => n.at < end).map((n) => ({ ...n, len: Math.min(n.len, end - n.at) }))
}
export interface Ending {
  id: EndingId
  title: string
  composer: string
  notes: readonly SequenceNote[]
  /** Durée d'une unité de temps des notes, en secondes. */
  unit: number
}

export type EndingId =
  | 'elise' | 'moonlight' | 'turkish-march'
  | 'bach-prelude' | 'swan' | 'dvorak'
  | 'te-deum' | 'taps'
  | 'skaters' | 'over-the-waves' | 'blue-danube'
  | 'morning' | 'faune' | 'badinerie'
  | 'rising-sun' | 'paganini-24' | 'mountain-king'
  | 'spring' | 'bella-ciao' | 'romance'

const PIECES: Record<EndingId, Ending> = {
  elise: { id: 'elise', title: 'La Lettre à Élise', composer: 'Beethoven', notes: FUR_ELISE, unit: FUR_ELISE_SIXTEENTH },
  moonlight: { id: 'moonlight', title: 'Sonate au clair de lune (3ᵉ mvt)', composer: 'Beethoven', notes: MOONLIGHT, unit: MOONLIGHT_SIXTEENTH },
  'turkish-march': {
    id: 'turkish-march',
    title: 'Marche turque',
    composer: 'Mozart',
    notes: TURKISH_MARCH,
    unit: TURKISH_MARCH_SIXTEENTH,
  },
  'bach-prelude': {
    id: 'bach-prelude',
    title: 'Prélude de la Suite n° 1',
    composer: 'Bach',
    notes: BACH_PRELUDE,
    unit: BACH_PRELUDE_SIXTEENTH,
  },
  swan: { id: 'swan', title: 'Le Cygne', composer: 'Saint-Saëns', notes: SWAN, unit: SWAN_BEAT },
  dvorak: { id: 'dvorak', title: 'Concerto pour violoncelle', composer: 'Dvořák', notes: DVORAK_CONCERTO, unit: DVORAK_BEAT },
  'te-deum': { id: 'te-deum', title: 'Te Deum, Prélude', composer: 'Charpentier', notes: TE_DEUM, unit: TE_DEUM_BEAT },
  'over-the-waves': { id: 'over-the-waves', title: 'Sobre las olas', composer: 'Rosas', notes: OVER_THE_WAVES, unit: OVER_THE_WAVES_BEAT },
  'blue-danube': { id: 'blue-danube', title: 'Le Beau Danube bleu', composer: 'Strauss', notes: BLUE_DANUBE, unit: BLUE_DANUBE_BEAT },
  morning: { id: 'morning', title: 'Au matin (Peer Gynt)', composer: 'Grieg', notes: MORNING_MOOD, unit: MORNING_EIGHTH },
  faune: { id: 'faune', title: 'Prélude à l’après-midi d’un faune', composer: 'Debussy', notes: FAUNE, unit: FAUNE_EIGHTH },
  badinerie: { id: 'badinerie', title: 'Badinerie', composer: 'Bach', notes: BADINERIE, unit: BADINERIE_SIXTEENTH },
  'rising-sun': { id: 'rising-sun', title: 'The House of the Rising Sun', composer: 'Traditionnel', notes: RISING_SUN, unit: RISING_SUN_BEAT },
  'paganini-24': { id: 'paganini-24', title: 'Caprice n° 24', composer: 'Paganini', notes: PAGANINI_24, unit: PAGANINI_SIXTEENTH },
  'mountain-king': {
    id: 'mountain-king',
    title: 'Dans l’antre du roi de la montagne',
    composer: 'Grieg',
    notes: MOUNTAIN_KING,
    unit: MOUNTAIN_KING_EIGHTH,
  },
  taps: { id: 'taps', title: 'Taps (sonnerie aux morts américaine)', composer: 'Traditionnel', notes: TAPS, unit: TAPS_EIGHTH },
  spring: { id: 'spring', title: 'Le Printemps', composer: 'Vivaldi', notes: SPRING, unit: SPRING_BEAT },
  skaters: { id: 'skaters', title: 'Les Patineurs', composer: 'Waldteufel', notes: SKATERS, unit: SKATERS_BEAT },
  'bella-ciao': { id: 'bella-ciao', title: 'Bella ciao', composer: 'chant populaire italien', notes: BELLA_CIAO, unit: BELLA_CIAO_EIGHTH },
  romance: { id: 'romance', title: 'Romance (Jeux interdits)', composer: 'Anonyme', notes: ROMANCE, unit: ROMANCE_BEAT },
}

export const ENDINGS = { ...PIECES }
for (const e of Object.values(PIECES)) ENDINGS[e.id] = { ...e, notes: firstSeconds(e.notes, e.unit) }

/** Morceaux proposés pour chaque instrument ; le premier est celui par défaut. */
export const INSTRUMENT_ENDINGS: Record<InstrumentId, EndingId[]> = {
  piano: ['elise', 'moonlight', 'turkish-march'],
  violin: ['spring'],
  cello: ['bach-prelude', 'swan', 'dvorak'],
  clarinet: ['bella-ciao'],
  trumpet: ['te-deum', 'taps'],
  accordion: ['skaters', 'over-the-waves', 'blue-danube'],
  guitar: ['romance'],
  flute: ['morning', 'faune', 'badinerie'],
  'electric-guitar': ['rising-sun', 'paganini-24', 'mountain-king'],
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
