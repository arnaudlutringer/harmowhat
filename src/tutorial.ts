/** Tutoriel de première ouverture : vu une fois, il n'est plus proposé (mémorisé sur l'appareil). */

const STORAGE_KEY = 'harmowhat.tutorial.done'

export function isTutorialDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Stockage indisponible : on ne bloque pas le joueur dans le tutoriel.
    return true
  }
}

export function markTutorialDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Stockage indisponible : le tutoriel reviendra à la prochaine ouverture.
  }
}
