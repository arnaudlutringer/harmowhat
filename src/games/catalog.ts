import { ref } from 'vue'
import { gameEnabled } from '@/config/features'
import { GAME_ICONS } from './icons'
import type { GameId } from './highScores'
import { earnedTrophies, impossibleUnlocked, LEVEL_MEDALS, levelMedalWon, type Tier } from './trophies'

/** Rangement des jeux : l'accueil montre les quatre familles, et chacune ouvre la liste de ses jeux. */

export interface Family {
  id: string
  title: string
  color: string
  games: GameId[]
}

export const FAMILIES: Family[] = [
  { id: 'oreille', title: "L'oreille", color: 'var(--hw-category-ear)', games: ['grave-ou-aigu', 'quelle-note', 'accords', 'harmonies', 'modalite'] },
  { id: 'voix', title: 'La voix', color: 'var(--hw-category-voice)', games: ['chante-note', 'chante-harmonie', 'lis-chante'] },
  { id: 'solfege', title: 'Le solfège', color: 'var(--hw-category-theory)', games: ['lecture-note', 'fais-harmonie', 'tonalite', 'lis-dis'] },
  { id: 'rythme', title: 'Rythme et tempo', color: 'var(--hw-category-rhythm)', games: ['quel-rythme', 'joue-rythme', 'garde-tempo', 'trouve-tempo'] },
]

/** Description courte d'un jeu sur sa carte (la version complète est dans ses réglages). */
export const BLURBS: Record<GameId, string> = {
  'grave-ou-aigu': 'Plus grave ou plus aiguë que le La3 du diapason ?',
  'quelle-note': 'Retrouve la note jouée parmi plusieurs propositions.',
  accords: 'Trois notes jouées ensemble : retrouve-les toutes les trois.',
  harmonies: "Deux notes l'une après l'autre : trouve l'intervalle.",
  modalite: "Devine la modalité à l'oreille.",
  'chante-note': 'Chante dans le micro la note demandée, au plus juste.',
  'chante-harmonie': "Une note est jouée : chante l'intervalle demandé.",
  'lis-chante': 'Chante les notes qui défilent sur la portée.',
  'lecture-note': 'Quelle est cette note sur la portée ?',
  'fais-harmonie': "Trouve la note qui forme l'intervalle demandé.",
  tonalite: "Trouve la tonalité d'après l'armure.",
  'lis-dis': 'Dis le nom des notes qui défilent sur la portée.',
  'quel-rythme': 'Écoute un rythme de 3 temps et retrouve ses figures.',
  'joue-rythme': 'Lis le rythme écrit et tape-le en mesure.',
  'garde-tempo': 'Tape chaque temps, le plus longtemps possible.',
  'trouve-tempo': 'Écoute une mélodie et retrouve son tempo.',
}

export const familyGames = (family: Family) => family.games.filter((g) => gameEnabled(g))

export const familyPath = (family: Family) => `/famille/${family.id}`

/** L'écran de la famille d'un jeu (là où ramène le retour depuis ses réglages). */
export function gameFamilyPath(game: GameId): string {
  const family = FAMILIES.find((f) => f.games.includes(game))
  return family ? familyPath(family) : '/home'
}

const TIERS: Tier[] = ['debutant', 'normal', 'expert', 'impossible']

/**
 * Médailles d'un jeu : bronze, argent et or (un sans faute en débutant, normal, expert), la couronne en impossible
 * une fois ce niveau débloqué, puis le diamant du GOAT.
 */
export function gameMedals(game: GameId) {
  const levels = TIERS.filter((t) => t !== 'impossible' || impossibleUnlocked.value.includes(game))
  return [
    ...levels.map((t) => ({ medal: LEVEL_MEDALS[t].medal, won: levelMedalWon(game, t) })),
    { medal: '💎', won: !!earnedTrophies.value[`goat-${game}`] },
  ]
}

/** « 3 médailles sur 20 » : la progression d'un ensemble de jeux. */
export function medalsText(games: GameId[]): string {
  const medals = games.flatMap(gameMedals)
  const won = medals.filter((m) => m.won).length
  return `${won} médaille${won > 1 ? 's' : ''} sur ${medals.length}`
}

const LAST_GAME_KEY = 'harmowhat.lastGame'

function loadLastGame(): GameId | null {
  try {
    const saved = localStorage.getItem(LAST_GAME_KEY)
    return saved && saved in GAME_ICONS ? (saved as GameId) : null
  } catch {
    return null
  }
}

/** Dernier jeu lancé depuis ses réglages (réactif : la carte « Rejouer » de l'accueil). */
export const lastGame = ref<GameId | null>(loadLastGame())

export function rememberLastGame(game: GameId) {
  lastGame.value = game
  try {
    localStorage.setItem(LAST_GAME_KEY, game)
  } catch {
    // Stockage indisponible : valable pour cette session seulement.
  }
}
