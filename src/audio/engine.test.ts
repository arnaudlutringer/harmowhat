import { describe, expect, it, vi } from 'vitest'

class FakeContext {
  state = 'running'
  destination = {}
  createGain() {
    return { gain: { value: 1 }, connect() {} }
  }
  suspend() {
    this.state = 'suspended'
    return Promise.resolve()
  }
  resume() {
    this.state = 'running'
    return Promise.resolve()
  }
}

describe("Sortie de l'appli", () => {
  it('coupe le son en quittant l’écran, sans le laisser repartir avant le retour', async () => {
    vi.stubGlobal('AudioContext', FakeContext)
    const { audioContext, onStopAll, setAppInBackground } = await import('./engine')
    const ctx = audioContext()
    const stopped = vi.fn()
    onStopAll(stopped)

    setAppInBackground(true)
    expect(stopped).toHaveBeenCalled()
    expect(ctx.state).toBe('suspended')
    // Un son demandé pendant ce temps (minuteur d'un jeu) ne relance pas le contexte.
    audioContext()
    expect(ctx.state).toBe('suspended')

    setAppInBackground(false)
    expect(ctx.state).toBe('running')
  })
})
