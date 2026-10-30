import { ref } from 'vue'
import { playRecording, playSequence, type SequenceNote } from '@/audio/engine'
import { INSTRUMENTS, type InstrumentId } from '@/audio/instruments'
import { drunk } from './drunk'
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
import { MENDELSSOHN, MENDELSSOHN_BEAT } from './mendelssohn'
import { DANSE_MACABRE, DANSE_MACABRE_BEAT } from './danseMacabre'
import { RHAPSODY_IN_BLUE, RHAPSODY_BEAT } from './rhapsodyInBlue'
import { HAVA_NAGILA, HAVA_NAGILA_EIGHTH } from './havaNagila'
import { GREENSLEEVES, GREENSLEEVES_BEAT } from './greensleeves'
import { GRAN_VALS, GRAN_VALS_BEAT } from './granVals'
import { ASTURIAS, ASTURIAS_SIXTEENTH } from './asturias'
import { SPRING, SPRING_BEAT } from './vivaldiSpring'
import { SKATERS, SKATERS_BEAT } from './skatersWaltz'
import { BELLA_CIAO, BELLA_CIAO_EIGHTH } from './bellaCiao'
import { ROMANCE, ROMANCE_BEAT } from './romance'
import { TICO_TICO, TICO_TICO_EIGHTH } from './ticoTico'
import { VALSE_MUSETTE, VALSE_MUSETTE_EIGHTH } from './valseMusette'
import { HEDWIG, HEDWIG_EIGHTH } from './hedwig'
import { PIANO_JAZZ, PIANO_JAZZ_EIGHTH } from './pianoJazz'

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
  /**
   * Enregistrement joué à la place des notes (fichier de public/). Ses notes ne peuvent pas être
   * altérées : il est joué tel quel, quelles que soient les erreurs.
   */
  recording?: string
}

export type EndingId =
  | 'elise'| 'moonlight' | 'turkish-march' | 'piano-jazz'
  | 'bach-prelude' | 'swan' | 'dvorak' | 'hedwig'
  | 'te-deum' | 'taps' | 'entertainer'
  | 'skaters' | 'over-the-waves' | 'blue-danube' | 'valse-musette'
  | 'morning' | 'faune' | 'badinerie'
  | 'rising-sun' | 'paganini-24' | 'mountain-king'
  | 'mendelssohn' | 'danse-macabre'
  | 'rhapsody' | 'hava-nagila' | 'greensleeves' | 'gran-vals' | 'asturias'
  | 'spring' | 'bella-ciao' | 'romance' | 'tico-tico'

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
  'piano-jazz': { id: 'piano-jazz', title: 'Piano Jazz in E♭', composer: 'Holly Vose', notes: PIANO_JAZZ, unit: PIANO_JAZZ_EIGHTH },
  'bach-prelude': {
    id: 'bach-prelude',
    title: 'Prélude de la Suite n° 1',
    composer: 'Bach',
    notes: BACH_PRELUDE,
    unit: BACH_PRELUDE_SIXTEENTH,
  },
  swan: { id: 'swan', title: 'Le Cygne', composer: 'Saint-Saëns', notes: SWAN, unit: SWAN_BEAT },
  dvorak: { id: 'dvorak', title: 'Concerto pour violoncelle', composer: 'Dvořák', notes: DVORAK_CONCERTO, unit: DVORAK_BEAT },
  hedwig: { id: 'hedwig', title: 'Hedwig’s Theme (Harry Potter)', composer: 'John Williams', notes: HEDWIG, unit: HEDWIG_EIGHTH },
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
  mendelssohn: { id: 'mendelssohn', title: 'Concerto pour violon', composer: 'Mendelssohn', notes: MENDELSSOHN, unit: MENDELSSOHN_BEAT },
  'danse-macabre': { id: 'danse-macabre', title: 'Danse macabre', composer: 'Saint-Saëns', notes: DANSE_MACABRE, unit: DANSE_MACABRE_BEAT },
  rhapsody: { id: 'rhapsody', title: 'Rhapsody in Blue', composer: 'Gershwin', notes: RHAPSODY_IN_BLUE, unit: RHAPSODY_BEAT },
  'hava-nagila': { id: 'hava-nagila', title: 'Hava Nagila', composer: 'Traditionnel', notes: HAVA_NAGILA, unit: HAVA_NAGILA_EIGHTH },
  greensleeves: { id: 'greensleeves', title: 'Greensleeves', composer: 'Traditionnel', notes: GREENSLEEVES, unit: GREENSLEEVES_BEAT },
  'gran-vals': { id: 'gran-vals', title: 'Gran Vals', composer: 'Tárrega', notes: GRAN_VALS, unit: GRAN_VALS_BEAT },
  asturias: { id: 'asturias', title: 'Asturias (Leyenda)', composer: 'Albéniz', notes: ASTURIAS, unit: ASTURIAS_SIXTEENTH },
  taps: { id: 'taps', title: 'Taps (sonnerie aux morts américaine)', composer: 'Traditionnel', notes: TAPS, unit: TAPS_EIGHTH },
  entertainer: { id: 'entertainer', title: 'The Entertainer', composer: 'Scott Joplin', notes: ENTERTAINER, unit: ENTERTAINER_SIXTEENTH },
  spring: { id: 'spring', title: 'Le Printemps', composer: 'Vivaldi', notes: SPRING, unit: SPRING_BEAT },
  skaters: { id: 'skaters', title: 'Les Patineurs', composer: 'Waldteufel', notes: SKATERS, unit: SKATERS_BEAT },
  'valse-musette': {
    id: 'valse-musette',
    title: 'Une valse musette',
    composer: 'Philippe Brédif',
    notes: VALSE_MUSETTE,
    unit: VALSE_MUSETTE_EIGHTH,
  },
  'bella-ciao': { id: 'bella-ciao', title: 'Bella ciao', composer: 'chant populaire italien', notes: BELLA_CIAO, unit: BELLA_CIAO_EIGHTH },
  'tico-tico': { id: 'tico-tico', title: 'Tico-Tico', composer: 'Zequinha de Abreu', notes: TICO_TICO, unit: TICO_TICO_EIGHTH },
  romance: { id: 'romance', title: 'Romance (Jeux interdits)', composer: 'Anonyme', notes: ROMANCE, unit: ROMANCE_BEAT },
}

export const ENDINGS = { ...PIECES }
for (const e of Object.values(PIECES)) ENDINGS[e.id] = { ...e, notes: firstSeconds(e.notes, e.unit) }

/** Morceaux proposés pour chaque instrument ; le premier est celui par défaut. */
export const INSTRUMENT_ENDINGS: Record<InstrumentId, EndingId[]> = {
  piano: ['elise', 'moonlight', 'turkish-march', 'piano-jazz'],
  violin: ['spring', 'mendelssohn', 'danse-macabre'],
  cello: ['bach-prelude', 'swan', 'dvorak', 'hedwig'],
  clarinet: ['rhapsody', 'hava-nagila', 'bella-ciao', 'tico-tico'],
  trumpet: ['te-deum', 'taps', 'entertainer'],
  accordion: ['skaters', 'over-the-waves', 'blue-danube', 'valse-musette'],
  guitar: ['romance', 'gran-vals', 'greensleeves', 'asturias'],
  flute: ['morning', 'faune', 'badinerie'],
  'electric-guitar': ['rising-sun', 'paganini-24', 'mountain-king'],
  // Au chœur, des morceaux dans sa tessiture : le Te Deum de Charpentier, Bella ciao, le Cygne en legato.
  choir: ['te-deum', 'bella-ciao', 'swan'],
}

/**
 * Joue un morceau de fin à l'instrument indiqué, d'autant plus mal joué (voir drunk.ts) que `wrongRatio`
 * est grand ; un enregistrement est joué tel quel. Renvoie la durée, en secondes.
 */
export function playEnding(e: Ending, instrument: InstrumentId, wrongRatio = 0): Promise<number> {
  if (e.recording) return playRecording(e.recording, ENDING_SECONDS)
  return playSequence(drunk(e.notes, wrongRatio), e.unit, undefined, INSTRUMENTS[instrument]).then((p) => p.duration)
}

export function endingsFor(instrument: InstrumentId): Ending[] {
  return INSTRUMENT_ENDINGS[instrument].map((id) => ENDINGS[id])
}

const STORAGE_KEY = 'harmowhat.endings'

function loadChoices(): Partial<Record<InstrumentId, EndingId>> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    // Un morceau retiré depuis (ex. le Slow Piano Blues) n'est plus proposé : endingFor revient au premier.
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
