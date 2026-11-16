import { computed, ref } from 'vue'
import { gameEnabled } from '@/config/features'
import type { GameId } from './highScores'

/**
 * Jeux à découvrir : un nouveau joueur commence avec 4 jeux (un par catégorie, les plus simples), puis un nouveau jeu
 * s'ouvre toutes les 2 parties terminées. Le défi du jour peut proposer un jeu encore fermé : le relever l'ouvre.
 * Les joueurs qui avaient déjà joué avant cette règle gardent tous leurs jeux, et « Tout débloquer » (Paramètres) ouvre tout.
 */

/** Les jeux ouverts dès le départ. */
export const STARTER: GameId[] = ['grave-ou-aigu', 'chante-note', 'lecture-note', 'quel-rythme']
/** L'ordre de découverte des autres, du plus simple au plus exigeant, en alternant les catégories. */
export const UNLOCK_ORDER: GameId[] = [
  'quelle-note', 'joue-rythme', 'harmonies', 'tonalite', 'chante-harmonie', 'accords',
  'garde-tempo', 'fais-harmonie', 'trouve-tempo', 'modalite', 'lis-chante', 'lis-dis',
]
/** Parties terminées pour ouvrir le jeu suivant. */
export const GAMES_PER_UNLOCK = 2

interface UnlockState {
  /** Tout est ouvert (joueur d'avant cette règle, ou « Tout débloquer »). */
  all: boolean
  /** Parties terminées depuis le début de la découverte. */
  finished: number
  /** Jeux ouverts en avance, par le défi du jour. */
  extra: GameId[]
}

const KEY = 'harmowhat.unlocks'

function save(s: UnlockState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Stockage indisponible : valable pour cette session.
  }
}

/** Au premier lancement de cette version : un joueur qui a déjà terminé des parties garde tous ses jeux. */
export function initialState(alreadyPlayed: boolean): UnlockState {
  return { all: alreadyPlayed, finished: 0, extra: [] }
}

function load(alreadyPlayed: () => boolean): UnlockState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw && typeof raw === 'object') return { all: !!raw.all, finished: Number(raw.finished) || 0, extra: Array.isArray(raw.extra) ? raw.extra : [] }
  } catch {
    // Illisible : on repart du début.
  }
  const fresh = initialState(alreadyPlayed())
  save(fresh)
  return fresh
}

const state = ref<UnlockState>({ all: true, finished: 0, extra: [] })

/** À appeler au lancement, avec de quoi savoir si le joueur avait déjà joué (avant cette règle). */
export function initUnlocks(alreadyPlayed: () => boolean) {
  state.value = load(alreadyPlayed)
}

/** Les jeux de l'ordre de découverte qui existent dans cette version (interrupteurs). */
const order = () => UNLOCK_ORDER.filter((g) => gameEnabled(g))

/** Jeux ouverts, d'après un état (pur : testable). */
export function openGames(s: UnlockState): GameId[] {
  const byCount = order().slice(0, Math.floor(s.finished / GAMES_PER_UNLOCK))
  return [...new Set([...STARTER, ...byCount, ...s.extra])]
}

export const allUnlocked = computed(() => state.value.all || order().every((g) => openGames(state.value).includes(g)))

export function isUnlocked(game: GameId): boolean {
  return allUnlocked.value || openGames(state.value).includes(game)
}

/** Le prochain jeu à s'ouvrir, et les parties qui manquent. */
export const nextUnlock = computed<{ game: GameId; remaining: number } | null>(() => {
  if (allUnlocked.value) return null
  const open = openGames(state.value)
  const game = order().find((g) => !open.includes(g))
  if (!game) return null
  return { game, remaining: GAMES_PER_UNLOCK - (state.value.finished % GAMES_PER_UNLOCK) }
})

/** Nombre de jeux ouverts sur le total (pour l'avancée affichée sur l'accueil). */
export const unlockProgress = computed(() => {
  const total = STARTER.length + order().length
  return { open: allUnlocked.value ? total : openGames(state.value).length, total }
})

/**
 * Fin d'une partie : le compteur avance, et le défi du jour relevé ouvre son jeu.
 * Renvoie les jeux qui viennent de s'ouvrir (à annoncer).
 */
export function recordFinishedGame(challengeWon?: GameId): GameId[] {
  if (state.value.all) return []
  const before = openGames(state.value)
  const next: UnlockState = { ...state.value, finished: state.value.finished + 1, extra: [...state.value.extra] }
  if (challengeWon && !before.includes(challengeWon)) next.extra.push(challengeWon)
  state.value = next
  save(next)
  return openGames(next).filter((g) => !before.includes(g))
}

/** « Tout débloquer » (Paramètres). */
export function unlockAll() {
  state.value = { ...state.value, all: true }
  save(state.value)
}
