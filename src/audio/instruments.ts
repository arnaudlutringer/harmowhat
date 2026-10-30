import { ref } from 'vue'
import { PIANO_HIGHEST, PIANO_LOWEST, randomInt } from '@/music/notes'

/**
 * Instruments disponibles pour jouer les notes et les accords.
 * Chaque instrument a sa tessiture (notes réelles, en numéros MIDI) : les
 * questions des jeux sont tirées uniquement dans cette tessiture.
 * Échantillons dans public/samples/<dossier>/, licence dans LICENSE.txt.
 */

export type InstrumentId = 'piano' | 'violin' | 'cello' | 'clarinet' | 'trumpet' | 'accordion' | 'guitar' | 'flute' | 'electric-guitar' | 'choir'

export interface Instrument {
  id: InstrumentId
  label: string
  emoji: string
  /** Note la plus grave et la plus aiguë jouables (MIDI, bornes incluses). */
  low: number
  high: number
  /** Volume relatif, pour équilibrer les instruments entre eux (les sons Musyng Kite sont enregistrés plus bas, ceux de tonejs-instruments bien plus fort). */
  gain: number
  /** Notes échantillonnées, quand elles ne suivent pas la grille par tierces mineures depuis la note la plus grave. */
  samples?: readonly number[]
  /**
   * Jeu lié dans les morceaux (sons à attaque lente, comme le chœur) : chaque note démarre `offset` secondes
   * après le début de l'échantillon et déborde de `overlap` secondes sur la suivante.
   */
  legato?: { offset: number; overlap: number }
}

/** Guitare électrique (tonejs-instruments) : mi grave, puis une note toutes les tierces mineures de fa♯ à do aigu. */
const ELECTRIC_GUITAR_SAMPLES = [40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84]

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  piano: { id: 'piano', label: 'Piano', emoji: '🎹', low: PIANO_LOWEST, high: PIANO_HIGHEST, gain: 1 },
  violin: { id: 'violin', label: 'Violon', emoji: '🎻', low: 55, high: 100, gain: 1.2 },
  cello: { id: 'cello', label: 'Violoncelle', emoji: '🎻', low: 36, high: 81, gain: 1 },
  clarinet: { id: 'clarinet', label: 'Clarinette', emoji: '🎶', low: 50, high: 91, gain: 0.95 },
  trumpet: { id: 'trumpet', label: 'Trompette', emoji: '🎺', low: 52, high: 82, gain: 1 },
  accordion: { id: 'accordion', label: 'Accordéon', emoji: '🪗', low: 53, high: 93, gain: 2 },
  guitar: { id: 'guitar', label: 'Guitare', emoji: '🎸', low: 40, high: 83, gain: 1.8 },
  flute: { id: 'flute', label: 'Flûte traversière', emoji: '🪈', low: 60, high: 96, gain: 1.2 },
  'electric-guitar': { id: 'electric-guitar', label: 'Guitare électrique', emoji: '⚡', low: 40, high: 86, gain: 0.23, samples: ELECTRIC_GUITAR_SAMPLES },
  // Chœur mixte (Choir Aahs) : des basses aux sopranos, de Do2 à La4.
  choir: { id: 'choir', label: 'Chœur', emoji: '👥', low: 48, high: 81, gain: 1.3, legato: { offset: 0.25, overlap: 0.35 } },
}

export const DEFAULT_INSTRUMENT: InstrumentId = 'piano'

const SAMPLE_STEP = 3

/** Notes échantillonnées : une toutes les tierces mineures, plus la note la plus aiguë (ou la liste propre à l'instrument). */
export function sampleMidis(inst: Instrument): number[] {
  if (inst.samples) return [...inst.samples]
  const midis: number[] = []
  for (let m = inst.low; m <= inst.high; m += SAMPLE_STEP) midis.push(m)
  if (midis[midis.length - 1] < inst.high) midis.push(inst.high)
  return midis
}

/** L'échantillon le plus proche d'une note (à un demi-ton au plus dans la tessiture, deux pour le ré aigu de la guitare électrique). */
export function nearestSample(inst: Instrument, midi: number): number {
  return sampleMidis(inst).reduce((best, s) => (Math.abs(s - midi) < Math.abs(best - midi) ? s : best))
}

/** Ramène une note dans la tessiture de l'instrument en la décalant d'une ou plusieurs octaves. */
export function fitToRange(inst: Instrument, midi: number): number {
  let m = midi
  while (m < inst.low) m += 12
  while (m > inst.high) m -= 12
  return m < inst.low ? midi : m
}

/** Intersection d'une plage de notes avec la tessiture de l'instrument (toute la tessiture si elles ne se croisent pas). */
export function rangeFor(inst: Instrument, low: number, high: number): { low: number; high: number } {
  const lo = Math.max(low, inst.low)
  const hi = Math.min(high, inst.high)
  return lo <= hi ? { low: lo, high: hi } : { low: inst.low, high: inst.high }
}

/** Une note aléatoire de la tessiture de l'instrument, en excluant éventuellement certaines notes. */
export function randomInstrumentNote(inst: Instrument, exclude: number[] = []): number {
  let n: number
  do {
    n = randomInt(inst.low, inst.high)
  } while (exclude.includes(n))
  return n
}

const STORAGE_KEY = 'harmowhat.instrument'

export function parseInstrument(raw: unknown): InstrumentId {
  return typeof raw === 'string' && raw in INSTRUMENTS ? (raw as InstrumentId) : DEFAULT_INSTRUMENT
}

function loadSaved(): InstrumentId {
  try {
    return parseInstrument(localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_INSTRUMENT
  }
}

/** Instrument choisi par le joueur (réglage global, mémorisé sur l'appareil). */
export const selectedInstrument = ref<InstrumentId>(loadSaved())

export function currentInstrument(): Instrument {
  return INSTRUMENTS[selectedInstrument.value]
}

export function setInstrument(id: InstrumentId): void {
  selectedInstrument.value = parseInstrument(id)
  try {
    localStorage.setItem(STORAGE_KEY, selectedInstrument.value)
  } catch {
    // Stockage indisponible : le choix vaut pour cette session.
  }
}
