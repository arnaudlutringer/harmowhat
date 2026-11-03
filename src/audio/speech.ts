import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

/**
 * Reconnaissance vocale en continu (jeu « Lecture continue ») : le texte reconnu arrive au fil de la parole,
 * en français. Sur le téléphone, le module natif d'Android ou d'iOS ; dans le navigateur, la reconnaissance
 * du navigateur (Chrome). La reconnaissance s'arrête d'elle-même après un silence : on la relance aussitôt,
 * et chaque relance ouvre une nouvelle « séance » (le texte repart de zéro).
 */

export interface SpeechListening {
  stop: () => void
}

/** Texte reconnu depuis le début de la séance `session` ; `final` : la phrase est terminée. */
export type OnSpeech = (text: string, session: number, final: boolean) => void

const LANGUAGE = 'fr-FR'

interface WebRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function webRecognition(): (new () => WebRecognition) | undefined {
  const w = window as unknown as { SpeechRecognition?: new () => WebRecognition; webkitSpeechRecognition?: new () => WebRecognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/** La reconnaissance vocale existe-t-elle sur cet appareil ? */
export async function speechAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return !!webRecognition()
  try {
    return (await SpeechRecognition.available()).available
  } catch {
    return false
  }
}

export async function listenToSpeech(onSpeech: OnSpeech): Promise<SpeechListening> {
  return Capacitor.isNativePlatform() ? listenNative(onSpeech) : listenWeb(onSpeech)
}

async function listenNative(onSpeech: OnSpeech): Promise<SpeechListening> {
  const { speechRecognition } = await SpeechRecognition.requestPermissions()
  if (speechRecognition !== 'granted') throw new Error('Micro refusé')
  let stopped = false
  let session = 0
  let starting = false
  let restart: ReturnType<typeof setTimeout> | undefined
  const handles: PluginListenerHandle[] = []
  handles.push(await SpeechRecognition.addListener('partialResults', ({ matches }) => {
    if (!stopped && matches?.[0]) onSpeech(matches[0], session, false)
  }))
  // Une nouvelle séance commence quand le joueur se remet à parler, pas à la relance : le résultat final de la
  // séance précédente, qui arrive après la relance, reste ainsi rattaché à elle (sans quoi ses notes, déjà jugées,
  // seraient comptées une deuxième fois comme réponse à la note suivante).
  handles.push(await SpeechRecognition.addListener('listeningState', ({ status }) => {
    if (stopped) return
    if (status === 'started') session++
    else {
      // Fin de phrase : on relance tout de suite (le temps de recevoir le résultat final), sans attendre la surveillance.
      clearTimeout(restart)
      restart = setTimeout(() => void start(), 250)
    }
  }))
  async function start() {
    if (stopped || starting) return
    starting = true
    try {
      await SpeechRecognition.start({ language: LANGUAGE, maxResults: 1, partialResults: true, popup: false })
    } catch {
      // Déjà en écoute, ou erreur passagère : la surveillance relance plus tard.
    } finally {
      starting = false
    }
  }
  // Après un silence (ou une erreur « rien entendu »), Android s'arrête sans prévenir : on vérifie et on relance.
  const watchdog = setInterval(async () => {
    if (stopped || starting) return
    try {
      if (!(await SpeechRecognition.isListening()).listening) void start()
    } catch {
      /* rien */
    }
  }, 300)
  await start()
  return {
    stop() {
      stopped = true
      clearInterval(watchdog)
      clearTimeout(restart)
      handles.forEach((h) => void h.remove())
      void SpeechRecognition.stop().catch(() => {})
    },
  }
}

async function listenWeb(onSpeech: OnSpeech): Promise<SpeechListening> {
  const Found = webRecognition()
  if (!Found) throw new Error('Reconnaissance vocale indisponible')
  const Recognition = Found
  let stopped = false
  let session = 0
  let recognition: WebRecognition | null = null
  let failed = false
  function start() {
    if (stopped) return
    session++
    const current = session
    const r = new Recognition()
    r.lang = LANGUAGE
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      if (stopped || current !== session) return
      let text = ''
      let final = true
      for (let i = 0; i < e.results.length; i++) {
        text += ` ${e.results[i][0].transcript}`
        final = e.results[i].isFinal
      }
      onSpeech(text.trim(), current, final)
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') failed = true
    }
    r.onend = () => {
      if (!stopped && !failed) start()
    }
    recognition = r
    r.start()
  }
  start()
  // Le navigateur refuse le micro : on le sait au premier essai.
  await new Promise((resolve) => setTimeout(resolve, 300))
  if (failed) throw new Error('Micro refusé')
  return {
    stop() {
      stopped = true
      recognition?.abort()
    },
  }
}
