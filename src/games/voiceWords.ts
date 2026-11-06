import { ref } from 'vue'
import { isKnownWord, setLearnedWords, spokenWords } from './sightReading'
import { loadTemplates } from '@/audio/wordMatch'
import { profile } from '@/player/profile'

/**
 * « Ma voix » : avant la première partie de « Lecture continue », le joueur dit chaque nom de note. Quand la reconnaissance vocale écrit autre chose que le mot attendu (« les » pour ré), cette
 * transcription est retenue sur l'appareil, et comprise ensuite comme la bonne syllabe.
 */

export interface VoiceWord {
  /** Syllabe comprise par le jeu (sans accent). */
  key: string
  /** Mot affiché au joueur. */
  label: string
}

export const VOICE_WORDS: VoiceWord[] = [
  { key: 'do', label: 'do' },
  { key: 're', label: 'ré' },
  { key: 'mi', label: 'mi' },
  { key: 'fa', label: 'fa' },
  { key: 'sol', label: 'sol' },
  { key: 'la', label: 'la' },
  { key: 'si', label: 'si' },
]

/** Nombre de fois que chaque mot est demandé. */
export const VOICE_TAKES = 2

const STORAGE_KEY = 'harmowhat.voiceWords'

interface Saved {
  /** Transcriptions apprises, par syllabe. */
  words: Record<string, string[]>
  /** Enregistrement fait au moins une fois. */
  done: boolean
}

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (raw && typeof raw === 'object' && raw.words && typeof raw.words === 'object') return { words: raw.words, done: !!raw.done }
  } catch {
    // Illisible : on repart de zéro.
  }
  return { words: {}, done: false }
}

/** Ce qui est enregistré (réactif : l'écran de réglages affiche si c'est fait). */
export const voiceWords = ref<Saved>(load())
setLearnedWords(voiceWords.value.words)

/**
 * Reconnaissance des notes dites : « par le son » (sur le téléphone, d'après les enregistrements du joueur, sans
 * Internet ; voir audio/wordMatch.ts), ou par Google (service de reconnaissance vocale, avec Internet).
 */
export type Recognition = 'son' | 'google'
const RECOGNITION_KEY = 'harmowhat.recognition'

// Toujours par le son : le choix a disparu des réglages, un ancien choix « Google » enregistré n'est plus lu.
export const recognition = ref<Recognition>('son')

export function setRecognition(r: Recognition) {
  recognition.value = r
  try {
    localStorage.setItem(RECOGNITION_KEY, r)
  } catch {
    // Stockage indisponible : valable pour cette session seulement.
  }
}

/** Les enregistrements « par le son » couvrent tous les mots. */
export const soundReady = () => {
  const t = loadTemplates()
  return VOICE_WORDS.every((w) => t[w.key]?.length)
}

/** Le joueur a déjà enregistré sa voix (pour la reconnaissance choisie). */
export const voiceReady = () => !voiceOwnerChanged() && (recognition.value === 'son' ? soundReady() : voiceWords.value.done)

const OWNER_KEY = 'harmowhat.voiceOwner'

/** Le joueur à qui appartient la voix enregistrée, d'après son nom. */
function readOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY)
  } catch {
    return null
  }
}

/** La voix enregistrée appartient désormais au joueur actuel. */
export function markVoiceOwner() {
  try {
    localStorage.setItem(OWNER_KEY, profile.value.name)
  } catch {
    // Stockage indisponible : valable pour cette session seulement.
  }
}

/**
 * Le nom du joueur a changé depuis l'enregistrement : c'est sans doute quelqu'un d'autre, sa voix est à enregistrer.
 * Un premier nom donné à un joueur qui n'en avait pas (ou une voix enregistrée avant ce suivi) n'est pas un changement.
 */
export function voiceOwnerChanged(): boolean {
  const owner = readOwner()
  if (owner === profile.value.name) return false
  if (owner === null || owner === '') {
    markVoiceOwner()
    return false
  }
  return true
}

/**
 * Transcription à retenir pour une syllabe, ou null : seulement si aucun de ses mots n'est déjà compris
 * (sinon elle serait déjà lue correctement, ou elle prendrait la place d'une autre note).
 */
export function toLearn(text: string): string | null {
  const list = spokenWords(text)
  if (!list.length || list.some(isKnownWord)) return null
  return list.join(' ')
}

/** Enregistre les transcriptions apprises (en remplaçant les précédentes). */
export function saveVoiceWords(words: Record<string, string[]>) {
  voiceWords.value = { words, done: true }
  setLearnedWords(words)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(voiceWords.value))
  } catch {
    // Stockage indisponible : valable pour cette session seulement.
  }
}
