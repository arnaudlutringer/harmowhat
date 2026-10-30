import { ref } from 'vue'

/**
 * Thème de l'appli (Paramètres › Affichage) : clair, sombre, ou comme le téléphone (par défaut).
 * Le thème sombre est la palette sombre d'Ionic (classe ion-palette-dark sur <html>), complétée dans variables.css.
 */
export type ThemeMode = 'clair' | 'sombre' | 'systeme'

export const THEME_MODES: { id: ThemeMode; label: string; description: string }[] = [
  { id: 'systeme', label: 'Comme le téléphone', description: 'Clair ou sombre selon le réglage du téléphone.' },
  { id: 'clair', label: 'Clair', description: 'Fond crème, toujours.' },
  { id: 'sombre', label: 'Sombre', description: 'Fond sombre, plus doux pour les yeux le soir.' },
]

const STORAGE_KEY = 'harmowhat.theme'

function load(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'clair' || raw === 'sombre' ? raw : 'systeme'
  } catch {
    return 'systeme'
  }
}

export const themeMode = ref<ThemeMode>(load())

const systemDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

function apply() {
  const dark = themeMode.value === 'sombre' || (themeMode.value === 'systeme' && !!systemDark?.matches)
  document.documentElement.classList.toggle('ion-palette-dark', dark)
}

export function setThemeMode(mode: ThemeMode): void {
  themeMode.value = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Stockage indisponible : le thème vaut pour cette session.
  }
  apply()
}

/** À appeler au lancement : applique le thème, et suit le téléphone s'il change de mode. */
export function initTheme(): void {
  apply()
  systemDark?.addEventListener('change', apply)
}
