import { ref } from 'vue'
import { boardOfKey, localScoreList, type Board, type GameId, type ScoreEntry } from './highScores'
import { profile } from '@/player/profile'

/**
 * Classement mondial : les scores enregistrés sur tous les appareils, dans une base Supabase
 * (table « scores », voir supabase/schema.sql), avec le pays du joueur.
 *
 * L'appli parle directement à l'API REST de Supabase avec la clé publique (anon), donnée à la
 * construction par VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (fichier .env). Sans elles,
 * seuls les scores de l'appareil sont disponibles.
 *
 * Les scores à envoyer passent par une file d'attente sur l'appareil : sans connexion, ils
 * partent plus tard. Chacun a un identifiant tiré au hasard, pour n'être enregistré qu'une fois.
 */

export interface WorldScore {
  name: string
  country: string
  points: number
  correct: number
  played_at: string
}

/** Record d'un jeu, avec le classement (niveau, nombre de questions) où il a été fait. */
export interface WorldRecord extends WorldScore {
  level: string
  questions: number
}

interface PendingScore {
  client_id: string
  game: GameId
  level: string
  questions: number
  name: string
  country: string
  points: number
  correct: number
  played_at: string
}

// L'adresse du projet, avec ou sans « /rest/v1/ » à la fin (les deux formes sont copiées depuis Supabase).
const URL_BASE = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const PENDING_KEY = 'harmowhat.pendingScores'
const UPLOADED_KEY = 'harmowhat.localScoresUploaded'
const TIMEOUT_MS = 8000
const COLUMNS = 'name,country,points,correct,played_at'

/** Le classement mondial est configuré (adresse et clé Supabase fournies à la construction). */
export const worldEnabled = Boolean(URL_BASE && KEY)

/** Classement affiché dans le Hall of fame et les meilleurs scores : le monde, le pays du joueur ou cet appareil. */
export type Scope = 'monde' | 'pays' | 'appareil'
export const scope = ref<Scope>(worldEnabled ? 'monde' : 'appareil')

export function parseScope(raw: unknown): Scope | undefined {
  return worldEnabled && (raw === 'monde' || raw === 'pays') ? raw : raw === 'appareil' ? 'appareil' : undefined
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(`${URL_BASE}/rest/v1/${path}`, {
      ...init,
      signal: controller.signal,
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...init.headers },
    })
  } finally {
    clearTimeout(timer)
  }
}

async function select<T>(query: string): Promise<T[]> {
  if (!worldEnabled) throw new Error('Classement mondial non configuré')
  const res = await request(`scores?${query}`)
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  return res.json()
}

const boardFilter = ({ game, level, questions }: Board) =>
  `game=eq.${encodeURIComponent(game)}&level=eq.${encodeURIComponent(level)}&questions=eq.${questions}`

/** Les 10 meilleurs scores d'un classement, dans le monde ou dans un pays. */
export function fetchBoard(board: Board, country?: string, limit = 10): Promise<WorldScore[]> {
  const where = boardFilter(board) + (country ? `&country=eq.${country}` : '')
  return select<WorldScore>(`select=${COLUMNS}&${where}&order=points.desc,played_at.asc&limit=${limit}`)
}

/** Le meilleur score d'un jeu, tous niveaux et nombres de questions confondus (dans le monde ou un pays). */
export async function fetchRecord(game: GameId, country?: string): Promise<WorldRecord | undefined> {
  const where = `game=eq.${game}` + (country ? `&country=eq.${country}` : '')
  const rows = await select<WorldRecord>(`select=${COLUMNS},level,questions&${where}&order=points.desc,played_at.asc&limit=1`)
  return rows[0]
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Repli (anciens navigateurs) : UUID v4 tiré avec Math.random.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function loadPending(): PendingScore[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function savePending(list: PendingScore[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list))
  } catch {
    // Stockage indisponible : les scores non envoyés sont perdus à la fermeture.
  }
}

function toPending(board: Board, entry: ScoreEntry, country: string): PendingScore {
  return {
    client_id: uuid(),
    game: board.game,
    level: board.level,
    questions: board.questions,
    name: entry.name,
    country,
    points: entry.points,
    correct: entry.correct,
    played_at: entry.date,
  }
}

let flushing: Promise<void> | null = null

/** Envoie les scores en attente ; ceux qui ne partent pas (pas de connexion) restent dans la file. */
export function flushPending(): Promise<void> {
  if (!worldEnabled) return Promise.resolve()
  flushing ??= (async () => {
    try {
      for (const score of loadPending()) {
        let sent = false
        try {
          const res = await request('scores', { method: 'POST', body: JSON.stringify(score), headers: { Prefer: 'return=minimal' } })
          // 409 : déjà enregistré (envoi précédent dont la réponse s'est perdue) ; 400 : refusé par la base, inutile d'insister.
          sent = res.ok || res.status === 409 || res.status === 400
        } catch {
          break // Pas de connexion : on réessaiera plus tard.
        }
        if (sent) savePending(loadPending().filter((p) => p.client_id !== score.client_id))
      }
    } finally {
      flushing = null
    }
  })()
  return flushing
}

/** Ajoute un score au classement mondial, avec le pays du joueur (envoi immédiat, ou plus tard sans connexion). */
export function submitScore(board: Board, entry: ScoreEntry, country = profile.value.country): Promise<void> {
  if (!worldEnabled) return Promise.resolve()
  savePending([...loadPending(), toPending(board, entry, country)])
  return flushPending()
}

/**
 * Une seule fois : envoie au classement mondial les scores déjà enregistrés sur l'appareil
 * (avant l'arrivée du classement mondial), avec le pays du profil. Puis envoie ce qui reste en attente.
 */
export function uploadLocalScoresOnce(): Promise<void> {
  if (!worldEnabled) return Promise.resolve()
  try {
    if (!localStorage.getItem(UPLOADED_KEY)) {
      const country = profile.value.country
      const old = localScoreList().map(({ key, entry }) => toPending(boardOfKey(key), entry, country))
      savePending([...loadPending(), ...old])
      localStorage.setItem(UPLOADED_KEY, '1')
    }
  } catch {
    // Stockage indisponible : rien à envoyer.
  }
  return flushPending()
}
