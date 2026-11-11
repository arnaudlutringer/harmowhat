import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  return import('./tracking')
}

const pending = () => JSON.parse(localStorage.getItem('harmowhat.pendingEvents') ?? '[]')

describe("Mesure d'utilisation", () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', fakeStorage())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("envoie l'action avec son jeu, son niveau et ses détails, puis la retire de la file", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', fetch)
    const t = await loadModule()
    t.track('partie_lancee', { game: 'accords', level: 'normal', details: { questions: 10, essai: false } })
    await t.flushEvents()
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://exemple.supabase.co/rest/v1/evenements')
    expect(JSON.parse(String(init.body))).toMatchObject({ type: 'partie_lancee', game: 'accords', level: 'normal', details: { questions: 10, essai: false } })
    expect(pending()).toEqual([])
  })

  it('garde les actions sans connexion et les renvoie plus tard, avec le même identifiant', async () => {
    const fetch = vi.fn(async (): Promise<Response> => {
      throw new TypeError('Failed to fetch')
    })
    vi.stubGlobal('fetch', fetch)
    const t = await loadModule()
    t.track('partage', { game: 'accords', details: { type: 'score' } })
    await t.flushEvents()
    expect(pending()).toHaveLength(1)
    const id = pending()[0].client_id
    fetch.mockImplementation(async () => new Response(null, { status: 201 }))
    await t.flushEvents()
    expect(JSON.parse(String((fetch.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body)).client_id).toBe(id)
    expect(pending()).toEqual([])
  })
})
