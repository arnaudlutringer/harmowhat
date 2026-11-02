import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { cleanName, GAMES, levelLabel, playHref, type Board, type GameId } from './highScores'
import { request, worldEnabled } from './worldScores'
import { profile } from '@/player/profile'

/**
 * Matchs à distance (table « matches », voir supabase/012_matchs.sql) : un joueur joue une partie avec une
 * graine ; un autre rejoue la même (mêmes questions) avec le code du match. Le plus de points gagne.
 */

export interface Match {
  code: string
  game: GameId
  level: string
  questions: number
  seed: number
  public: boolean
  creator_id: string
  creator_name: string
  creator_country: string
  creator_points: number
  creator_correct: number
  opponent_id: string | null
  opponent_name: string | null
  opponent_country: string | null
  opponent_points: number | null
  opponent_correct: number | null
  created_at: string
  finished_at: string | null
}

export interface RankingRow {
  player_id: string
  name: string
  country: string
  rating: number
  played: number
  wins: number
  draws: number
}

export type Outcome = 'victoire' | 'defaite' | 'nul'

/** Points de classement : +20 par victoire, 0 par nul, −10 par défaite (1 000 au départ). */
export const RATING_DELTA: Record<Outcome, number> = { victoire: 20, nul: 0, defaite: -10 }
export const RATING_START = 1000

/** Les matchs ont besoin de la base mondiale (Supabase). */
export const matchesAvailable = worldEnabled

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
/** Code de match : 6 caractères faciles à dicter (sans O, 0, I, 1). */
export const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')

/** Code saisi par le joueur, nettoyé (majuscules, sans espaces), ou null s'il n'a pas la bonne forme. */
export function parseCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return /^[A-Z0-9]{6}$/.test(code) ? code : null
}

export const boardOf = (m: Pick<Match, 'game' | 'level' | 'questions'>): Board => ({ game: m.game, level: m.level, questions: m.questions })

/** Adresse du jeu pour jouer ce match : ses réglages, sa graine et son code. */
export const matchHref = (m: Match) => `${playHref(boardOf(m))}&graine=${m.seed}&match=${m.code}`

/** Résultat d'un match terminé, du point de vue d'un joueur. */
export function outcomeFor(m: Match, playerId: string): Outcome | null {
  if (m.opponent_points === null) return null
  const mine = m.creator_id === playerId ? m.creator_points : m.opponent_points
  const theirs = m.creator_id === playerId ? m.opponent_points : m.creator_points
  return mine > theirs ? 'victoire' : mine < theirs ? 'defaite' : 'nul'
}

/** Lien direct vers un match, qui ouvre l'appli sur l'écran du match. */
export const matchLink = (code: string) => `loreille://match/${code}`

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  return res.json()
}

/** Publie le match que le joueur vient de jouer ; renvoie son code. */
export async function createMatch(board: Board, seed: number, points: number, correct: number, isPublic: boolean): Promise<Match> {
  const { id, country } = profile.value
  const name = cleanName(profile.value.name) || 'Anonyme'
  // Un code déjà pris (très rare) : on en tire un autre.
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = {
      code: newCode(), game: board.game, level: board.level, questions: board.questions, seed, public: isPublic,
      creator_id: id, creator_name: name, creator_country: country, creator_points: points, creator_correct: correct,
    }
    const res = await request('matches', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) })
    if (res.status === 409) continue
    return (await json<Match[]>(res))[0]
  }
  throw new Error('Code de match indisponible')
}

export async function fetchMatch(code: string): Promise<Match | null> {
  const rows = await json<Match[]>(await request(`matches?code=eq.${encodeURIComponent(code)}&limit=1`))
  return rows[0] ?? null
}

/** Relève le match : enregistre la partie de l'adversaire (une seule fois). Renvoie le match terminé, ou null s'il était déjà pris. */
export async function joinMatch(code: string, points: number, correct: number): Promise<Match | null> {
  const { id, country } = profile.value
  const name = cleanName(profile.value.name) || 'Anonyme'
  const res = await request('rpc/join_match', {
    method: 'POST',
    body: JSON.stringify({ p_code: code, p_id: id, p_name: name, p_country: country, p_points: points, p_correct: correct }),
  })
  return (await json<Match[]>(res))[0] ?? null
}

/** Les matchs du joueur (lancés ou relevés), du plus récent au plus ancien. */
export async function myMatches(): Promise<Match[]> {
  const id = profile.value.id
  return json<Match[]>(await request(`matches?or=(creator_id.eq.${id},opponent_id.eq.${id})&order=created_at.desc&limit=50`))
}

/** Matchs ouverts du monde : publics, sans adversaire, lancés par d'autres joueurs. */
export async function openMatches(): Promise<Match[]> {
  const id = profile.value.id
  return json<Match[]>(await request(`matches?public=is.true&opponent_id=is.null&creator_id=neq.${id}&order=created_at.desc&limit=30`))
}

export async function fetchRanking(): Promise<RankingRow[]> {
  return json<RankingRow[]>(await request('match_ranking?order=rating.desc,wins.desc&limit=50'))
}

// Résultats vus : un match terminé que le joueur n'a pas encore regardé est signalé (point rouge sur « Matchs »).
const SEEN_KEY = 'harmowhat.matchesSeen'
function loadSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')
  } catch {
    return []
  }
}
/** Nombre de matchs terminés pas encore vus (réactif). */
export const unseenResults = ref(0)

/** Codes des matchs terminés que le joueur n'a pas encore vus. */
export const unseenCodes = (matches: readonly Match[]) => {
  const seen = loadSeen()
  return matches.filter((m) => m.finished_at && !seen.includes(m.code)).map((m) => m.code)
}

/** Met à jour le compte des résultats pas encore vus à partir des matchs du joueur. */
export function countUnseen(matches: readonly Match[]) {
  const seen = loadSeen()
  unseenResults.value = matches.filter((m) => m.finished_at && !seen.includes(m.code)).length
}

/** Le joueur a regardé ses matchs : tous les résultats affichés sont vus. */
export function markSeen(matches: readonly Match[]) {
  const seen = new Set(loadSeen())
  for (const m of matches) if (m.finished_at) seen.add(m.code)
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300)))
  } catch {
    // Stockage indisponible : le point rouge reviendra.
  }
  unseenResults.value = 0
}

/** Au lancement de l'appli : vérifie s'il y a de nouveaux résultats. */
export function refreshUnseen() {
  if (!matchesAvailable) return
  myMatches().then(countUnseen).catch(() => {})
}

/** Texte de partage d'un match. */
export function shareText(m: Match): string {
  const title = GAMES[m.game].title
  return `Je te défie sur L'oreille ! « ${title} », niveau ${levelLabel(boardOf(m))} : bats mes ${m.creator_points.toLocaleString('fr-FR')} points. Code du match : ${m.code} — ${matchLink(m.code)}`
}

/** Partage le match (menu de partage du téléphone, ou presse-papiers dans un navigateur). Renvoie vrai si copié. */
export async function shareMatch(m: Match): Promise<'partage' | 'copie'> {
  const text = shareText(m)
  if (Capacitor.isNativePlatform()) {
    await Share.share({ text, dialogTitle: 'Défier un ami' })
    return 'partage'
  }
  if (navigator.share) {
    await navigator.share({ text }).catch(() => {})
    return 'partage'
  }
  await navigator.clipboard?.writeText(text)
  return 'copie'
}
