import { loadTemplates } from '@/audio/wordMatch'
import { profile } from '@/player/profile'

/**
 * « Ma voix » : avant la première partie de « Lecture continue », le joueur dit chaque nom de note : ses enregistrements
 * (audio/wordMatch.ts) servent ensuite à reconnaître ce qu'il dit.
 */

export interface VoiceWord {
  /** Clé de ses enregistrements (sans accent). */
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

/** Le joueur a enregistré sa voix : tous les mots, et c'est bien la sienne. */
export const voiceReady = () => {
  if (voiceOwnerChanged()) return false
  const t = loadTemplates()
  return VOICE_WORDS.every((w) => t[w.key]?.length)
}

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
