import { ref } from 'vue'
import { defaultCountry, isCountryCode, type CountryCode } from './countries'

/**
 * Profil du joueur (onglet Joueur des paramètres) : son nom et son pays, mémorisés sur l'appareil.
 * Le nom pré-remplit la saisie en fin de partie ; le pays accompagne chaque score envoyé au classement mondial.
 */

export interface Profile {
  name: string
  country: CountryCode
}

const STORAGE_KEY = 'harmowhat.profile'
/** Ancienne clé : dernier nom saisi en fin de partie, avant l'onglet Joueur des paramètres. */
const LEGACY_NAME_KEY = 'harmowhat.player'

function load(): Profile {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (raw && typeof raw === 'object') {
      return {
        name: typeof raw.name === 'string' ? raw.name : '',
        country: isCountryCode(raw.country) ? raw.country : defaultCountry(),
      }
    }
    return { name: localStorage.getItem(LEGACY_NAME_KEY) ?? '', country: defaultCountry() }
  } catch {
    return { name: '', country: defaultCountry() }
  }
}

export const profile = ref<Profile>(load())

export function saveProfile(next: Partial<Profile>): void {
  profile.value = { ...profile.value, ...next }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.value))
  } catch {
    // Stockage indisponible : le profil vaut pour cette session.
  }
}
