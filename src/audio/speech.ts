import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

/**
 * Reconnaissance vocale en continu (jeu « Lecture continue ») : le texte reconnu arrive au fil de la parole,
 * en français. Sur Android, le petit module natif de l'appli (plugins/speech), qui préfère le service de Google et
 * se relance de lui-même ; sur iOS, le module communautaire ; dans le navigateur, la reconnaissance du navigateur (Chrome). La reconnaissance s'arrête d'elle-même après un silence : on la relance aussitôt,
 * et chaque relance ouvre une nouvelle « séance » (le texte repart de zéro).
 */

export interface SpeechListening {
  stop: () => void
  /** Les attaques de la voix (début de chaque syllabe) arrivent dans les événements « onset » (Android). */
  onsets: boolean
}

/**
 * Texte reconnu depuis le début de la séance `session` ; `final` : la phrase est terminée ;
 * `alternatives` : les autres transcriptions possibles, de la plus à la moins probable (la première est `text`).
 */
export type OnSpeech = (text: string, session: number, final: boolean, alternatives: string[]) => void

/** Étape de la reconnaissance, pour le test du micro (prêt, début et fin de parole, niveau du micro, erreur…). */
export interface SpeechEvent {
  type: 'info' | 'ready' | 'begin' | 'end' | 'level' | 'onset' | 'partial' | 'final' | 'error'
  texts?: string[]
  db?: number
  code?: number
  message?: string
  service?: string
  at: number
}

interface LoreilleSpeechPlugin {
  available(): Promise<{ available: boolean; services: string[] }>
  start(options: { language: string }): Promise<{ service: string }>
  stop(): Promise<void>
  addListener(event: 'speech', listener: (e: SpeechEvent) => void): Promise<PluginListenerHandle>
}

const AndroidSpeech = registerPlugin<LoreilleSpeechPlugin>('LoreilleSpeech')
const isAndroid = () => Capacitor.getPlatform() === 'android'

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
    if (isAndroid()) return (await AndroidSpeech.available()).available
    return (await SpeechRecognition.available()).available
  } catch {
    return false
  }
}

/** Services de reconnaissance installés sur le téléphone (test du micro). */
export async function speechServices(): Promise<string[]> {
  if (!isAndroid()) return []
  try {
    return (await AndroidSpeech.available()).services
  } catch {
    return []
  }
}

/** Écoute en continu ; `onEvent` reçoit chaque étape de la reconnaissance (test du micro). */
export async function listenToSpeech(onSpeech: OnSpeech, onEvent?: (e: SpeechEvent) => void): Promise<SpeechListening> {
  if (isAndroid()) return listenAndroid(onSpeech, onEvent)
  return Capacitor.isNativePlatform() ? listenNative(onSpeech) : listenWeb(onSpeech, onEvent)
}

async function listenAndroid(onSpeech: OnSpeech, onEvent?: (e: SpeechEvent) => void): Promise<SpeechListening> {
  let session = 1
  const handle = await AndroidSpeech.addListener('speech', (e) => {
    onEvent?.(e)
    const texts = (e.texts ?? []).filter(Boolean)
    if (e.type === 'partial' && texts.length) onSpeech(texts[0], session, false, texts)
    if (e.type === 'final') {
      if (texts.length) onSpeech(texts[0], session, true, texts)
      // Le module se relance de lui-même après chaque phrase : la suivante repart de zéro.
      session++
    }
    if (e.type === 'error') session++
  })
  try {
    const { service } = await AndroidSpeech.start({ language: LANGUAGE })
    onEvent?.({ type: 'info', service, at: Date.now() })
  } catch (error) {
    void handle.remove()
    throw error
  }
  return {
    onsets: true,
    stop() {
      void handle.remove()
      void AndroidSpeech.stop().catch(() => {})
    },
  }
}

async function listenNative(onSpeech: OnSpeech): Promise<SpeechListening> {
  const { speechRecognition } = await SpeechRecognition.requestPermissions()
  if (speechRecognition !== 'granted') throw new Error('Micro refusé')
  let stopped = false
  let session = 0
  let starting = false
  let lastStart = 0
  /** Le joueur a fini sa phrase : Android n'écoute plus, et le résultat final de la phrase va arriver. */
  let awaitingFinal = false
  let fallback: ReturnType<typeof setTimeout> | undefined
  const handles: PluginListenerHandle[] = []
  handles.push(await SpeechRecognition.addListener('partialResults', ({ matches }) => {
    if (stopped || !matches?.[0]) return
    if (!awaitingFinal) return onSpeech(matches[0], session, false, matches)
    // Résultat final de la phrase (pour un mot court comme « do », souvent le seul résultat) : on le transmet,
    // puis seulement on relance l'écoute. Relancer avant l'annulerait.
    awaitingFinal = false
    clearTimeout(fallback)
    onSpeech(matches[0], session, true, matches)
    void start()
  }))
  handles.push(await SpeechRecognition.addListener('listeningState', ({ status }) => {
    if (stopped || status !== 'stopped') return
    awaitingFinal = true
    // Pas de résultat final (rien de compris) : on relance quand même au bout d'un moment.
    clearTimeout(fallback)
    fallback = setTimeout(() => {
      awaitingFinal = false
      void start()
    }, 2000)
  }))
  async function start() {
    if (stopped || starting) return
    starting = true
    lastStart = performance.now()
    session++
    try {
      await SpeechRecognition.start({ language: LANGUAGE, maxResults: 1, partialResults: true, popup: false })
    } catch {
      // Déjà en écoute, ou erreur passagère : la surveillance relance plus tard.
    } finally {
      starting = false
    }
  }
  // Sans parole (délai dépassé, rien entendu), Android s'arrête sans prévenir : on vérifie et on relance,
  // sauf quand une phrase vient de finir (son résultat final est attendu).
  const watchdog = setInterval(async () => {
    if (stopped || starting || awaitingFinal || performance.now() - lastStart < 1000) return
    try {
      if (!(await SpeechRecognition.isListening()).listening && !awaitingFinal) void start()
    } catch {
      /* rien */
    }
  }, 500)
  await start()
  return {
    onsets: false,
    stop() {
      stopped = true
      clearInterval(watchdog)
      clearTimeout(fallback)
      handles.forEach((h) => void h.remove())
      void SpeechRecognition.stop().catch(() => {})
    },
  }
}

async function listenWeb(onSpeech: OnSpeech, onEvent?: (e: SpeechEvent) => void): Promise<SpeechListening> {
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
      onEvent?.({ type: final ? 'final' : 'partial', texts: [text.trim()], at: Date.now() })
      onSpeech(text.trim(), current, final, [text.trim()])
    }
    r.onerror = (e) => {
      onEvent?.({ type: 'error', message: e.error, at: Date.now() })
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
    onsets: false,
    stop() {
      stopped = true
      recognition?.abort()
    },
  }
}
