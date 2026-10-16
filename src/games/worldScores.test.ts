import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Faux localStorage et faux serveur Supabase : le module est rechargé avec l'adresse et la clé configurées.
function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  }
}

async function loadModule() {
  vi.resetModules()
  vi.stubEnv('VITE_SUPABASE_URL', 'https://exemple.supabase.co/')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'cle-publique')
  return import('./worldScores')
}

const board = { game: 'accords' as const, level: 'normal', questions: 20 }
const entry = { name: 'Arno', points: 12345, correct: 18, date: '2026-10-16T08:00:00.000Z' }

describe('Classement mondial', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', fakeStorage())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('envoie le score avec le pays, puis le retire de la file d’attente', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', fetch)
    const w = await loadModule()
    expect(w.worldEnabled).toBe(true)
    await w.submitScore(board, entry, 'BE')
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://exemple.supabase.co/rest/v1/scores')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).apikey).toBe('cle-publique')
    const body = JSON.parse(String(init.body))
    expect(body).toMatchObject({ game: 'accords', level: 'normal', questions: 20, name: 'Arno', country: 'BE', points: 12345, correct: 18 })
    expect(body.client_id).toMatch(/^[0-9a-f-]{36}$/)
    expect(JSON.parse(localStorage.getItem('harmowhat.pendingScores')!)).toEqual([])
  })

  it('garde le score sans connexion et le renvoie plus tard, avec le même identifiant', async () => {
    const fetch = vi.fn(async (): Promise<Response> => {
      throw new TypeError('Failed to fetch')
    })
    vi.stubGlobal('fetch', fetch)
    const w = await loadModule()
    await w.submitScore(board, entry, 'FR')
    const pending = JSON.parse(localStorage.getItem('harmowhat.pendingScores')!)
    expect(pending).toHaveLength(1)

    // Retour de la connexion : déjà enregistré (409) ou enregistré (201), il quitte la file.
    fetch.mockImplementation(async () => new Response(null, { status: 409 }))
    await w.flushPending()
    expect(JSON.parse(String((fetch.mock.calls[1] as unknown as [string, RequestInit])[1].body)).client_id).toBe(pending[0].client_id)
    expect(JSON.parse(localStorage.getItem('harmowhat.pendingScores')!)).toEqual([])
  })

  it('envoie une seule fois les scores déjà enregistrés sur l’appareil', async () => {
    localStorage.setItem('harmowhat.scores', JSON.stringify({ 'accords|normal|20': [entry, { ...entry, name: 'Léa', points: 9000 }] }))
    localStorage.setItem('harmowhat.profile', JSON.stringify({ name: 'Arno', country: 'CA' }))
    const fetch = vi.fn(async () => new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', fetch)
    const w = await loadModule()
    await w.uploadLocalScoresOnce()
    await w.uploadLocalScoresOnce()
    expect(fetch).toHaveBeenCalledTimes(2)
    const sent = fetch.mock.calls.map((c) => JSON.parse(String((c as unknown as [string, RequestInit])[1].body)))
    expect(sent.map((s) => [s.name, s.points, s.country, s.played_at])).toEqual([
      ['Arno', 12345, 'CA', entry.date],
      ['Léa', 9000, 'CA', entry.date],
    ])
  })

  it('lit les 10 meilleurs d’un classement, dans le monde ou dans un pays', async () => {
    const fetch = vi.fn(async () => Response.json([{ name: 'Arno', country: 'FR', points: 12345, correct: 18, played_at: entry.date }]))
    vi.stubGlobal('fetch', fetch)
    const w = await loadModule()
    expect(await w.fetchBoard(board, 'FR')).toHaveLength(1)
    const url = (fetch.mock.calls[0] as unknown as [string])[0]
    expect(url).toContain('game=eq.accords&level=eq.normal&questions=eq.20&country=eq.FR')
    expect(url).toContain('order=points.desc,played_at.asc&limit=10')
  })
})
