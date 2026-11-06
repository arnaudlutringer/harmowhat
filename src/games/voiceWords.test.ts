import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveProfile } from '@/player/profile'
import { saveTemplates } from '@/audio/wordMatch'
import { markVoiceOwner, voiceOwnerChanged, voiceReady, VOICE_WORDS } from './voiceWords'

const allWords = () => Object.fromEntries(VOICE_WORDS.map((w) => [w.key, [[new Array(12).fill(0)]]]))

describe('« Ma voix » : à qui appartient la voix enregistrée', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    })
    saveProfile({ name: 'Arno' })
  })

  it('demande l’enregistrement tant qu’il manque des mots', () => {
    expect(voiceReady()).toBe(false)
    saveTemplates(allWords())
    expect(voiceReady()).toBe(true)
  })

  it('redemande l’enregistrement quand le nom du joueur change', () => {
    saveTemplates(allWords())
    markVoiceOwner()
    expect(voiceReady()).toBe(true)
    saveProfile({ name: 'Louise' })
    expect(voiceOwnerChanged()).toBe(true)
    expect(voiceReady()).toBe(false)
    markVoiceOwner()
    expect(voiceReady()).toBe(true)
  })

  it('ne redemande rien pour une voix déjà enregistrée sans nom, ni pour un premier nom', () => {
    saveTemplates(allWords())
    // Voix enregistrée avant ce suivi : le joueur actuel en devient le propriétaire.
    expect(voiceReady()).toBe(true)
    saveProfile({ name: '' })
    markVoiceOwner()
    saveProfile({ name: 'Louise' })
    expect(voiceReady()).toBe(true)
  })
})
