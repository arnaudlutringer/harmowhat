import { watch } from 'vue'
import { request, worldEnabled } from './worldScores'
import { profile } from '@/player/profile'
import { online } from '@/player/online'
import { uuid } from '@/player/uuid'

/**
 * Mesure d'utilisation : chaque action notée ici part dans la table « evenements » de Supabase
 * (voir supabase/014_evenements.sql), avec l'identifiant anonyme du joueur. Rien de personnel n'est envoyé.
 * Comme les scores, les actions passent par une file d'attente sur l'appareil : sans connexion, elles partent plus tard.
 */

export type EventType = 'partie_lancee' | 'partie_abandonnee' | 'rejouer' | 'partage'

interface PendingEvent {
  client_id: string
  player_id: string | null
  type: EventType
  game: string | null
  level: string | null
  details: Record<string, unknown>
  happened_at: string
}

const PENDING_KEY = 'harmowhat.pendingEvents'
/** Au-delà, les plus anciennes actions en attente sont oubliées (longue période sans connexion). */
const MAX_PENDING = 500

function loadPending(): PendingEvent[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function savePending(list: PendingEvent[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-MAX_PENDING)))
  } catch {
    // Stockage indisponible : les actions non envoyées sont perdues.
  }
}

let flushing: Promise<void> | null = null

/** Envoie les actions en attente ; celles qui ne partent pas (pas de connexion) restent dans la file. */
export function flushEvents(): Promise<void> {
  if (!worldEnabled) return Promise.resolve()
  flushing ??= (async () => {
    try {
      for (const event of loadPending()) {
        let sent = false
        try {
          const res = await request('evenements', { method: 'POST', body: JSON.stringify(event), headers: { Prefer: 'return=minimal' } })
          // Table pas encore créée dans Supabase : les actions attendent, elles partiront une fois le script exécuté.
          if (res.status === 404) break
          // 409 : déjà enregistrée ; 400 : refusée par la base, inutile d'insister.
          sent = res.ok || res.status === 409 || res.status === 400
        } catch {
          break // Pas de connexion : on réessaiera plus tard.
        }
        if (sent) savePending(loadPending().filter((e) => e.client_id !== event.client_id))
      }
    } finally {
      flushing = null
    }
  })()
  return flushing
}

/** Note une action (une partie lancée, un partage…), avec son jeu, son niveau et des détails libres. */
export function track(type: EventType, info: { game?: string; level?: string; details?: Record<string, unknown> } = {}): void {
  if (!worldEnabled) return
  savePending([
    ...loadPending(),
    {
      client_id: uuid(),
      player_id: profile.value.id ?? null,
      type,
      game: info.game ?? null,
      level: info.level ?? null,
      details: info.details ?? {},
      happened_at: new Date().toISOString(),
    },
  ])
  void flushEvents()
}

// Retour de la connexion : les actions en attente partent.
watch(online, (now) => now && void flushEvents())
