import { ref } from 'vue'
import { defaultCountry, isCountryCode, type CountryCode } from './countries'
import { uuid } from './uuid'

/**
 * Profil du joueur (onglet Mon compte des paramètres) : son nom et son pays, mémorisés sur l'appareil,
 * et un identifiant technique tiré une fois pour toutes, qui ne change pas avec le nom ou le pays.
 * Le nom pré-remplit la saisie en fin de partie ; le pays et l'identifiant accompagnent chaque score envoyé
 * au classement mondial (l'identifiant sert à reconnaître ses propres scores).
 */

export interface Profile {
  /** Identifiant technique du joueur (UUID). */
  id: string
  name: string
  country: CountryCode
  /** En fin de partie, un score qui entre dans un classement est enregistré tout seul, avec ce nom et ce pays. */
  autoSave: boolean
}

const STORAGE_KEY = 'harmowhat.profile'
/** Ancienne clé : dernier nom saisi en fin de partie, avant l'onglet Mon compte. */
const LEGACY_NAME_KEY = 'harmowhat.player'

const isUuid = (raw: unknown): raw is string => typeof raw === 'string' && /^[0-9a-f-]{36}$/i.test(raw)

function load(): Profile {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (raw && typeof raw === 'object') {
      return {
        id: isUuid(raw.id) ? raw.id : uuid(),
        name: typeof raw.name === 'string' ? raw.name : '',
        country: isCountryCode(raw.country) ? raw.country : defaultCountry(),
        autoSave: raw.autoSave !== false,
      }
    }
    return { id: uuid(), name: localStorage.getItem(LEGACY_NAME_KEY) ?? '', country: defaultCountry(), autoSave: true }
  } catch {
    return { id: uuid(), name: '', country: defaultCountry(), autoSave: true }
  }
}

function store() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.value))
  } catch {
    // Stockage indisponible : le profil vaut pour cette session.
  }
}

export const profile = ref<Profile>(load())
// L'identifiant est gardé dès le premier lancement, pour rester le même ensuite.
store()

export function saveProfile(next: Partial<Omit<Profile, 'id'>>): void {
  profile.value = { ...profile.value, ...next }
  store()
}
