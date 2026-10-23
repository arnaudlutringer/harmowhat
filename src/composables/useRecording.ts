import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { stopAll } from '@/audio/engine'
import { listenToMicrophone, type Listening } from '@/audio/microphone'
import type { Pitch } from '@/audio/pitch'
import { HeldNote } from '@/games/singTheNote'
import type { useQuiz } from './useQuiz'

/**
 * Prise de voix des jeux chantés : le bouton micro lance l'enregistrement et met le score en pause ;
 * dès qu'une note est tenue, l'enregistrement s'arrête, le score reprend et `onNote` reçoit sa fréquence.
 */
export function useRecording(quiz: Pick<ReturnType<typeof useQuiz>, 'pause' | 'resume' | 'canAnswer'>, onNote: (frequency: number) => void) {
  const held = new HeldNote()
  const recording = ref(false)
  /** Dernière mesure nette du micro (affichage en direct). */
  const live = shallowRef<Pitch | null>(null)
  /** Avancement vers une note tenue, de 0 à 1. */
  const hold = ref(0)
  const micError = ref('')
  let session: Listening | null = null

  function stopMicrophone() {
    session?.stop()
    session = null
  }

  /** Arrête la prise : le score reprend là où il s'était arrêté. */
  function stop() {
    stopMicrophone()
    recording.value = false
    hold.value = 0
    quiz.resume()
  }

  function onPitch(pitch: Pitch | null) {
    if (!recording.value || !quiz.canAnswer.value) return
    live.value = pitch && pitch.clarity >= 0.85 ? pitch : null
    const frequency = held.push(pitch)
    hold.value = held.progress
    if (frequency === null) return
    stop()
    onNote(frequency)
  }

  async function start() {
    micError.value = ''
    // On coupe le son en cours : le micro ne doit entendre que la voix.
    stopAll()
    held.reset()
    live.value = null
    hold.value = 0
    recording.value = true
    quiz.pause()
    try {
      session = await listenToMicrophone(onPitch)
      // Arrêté pendant l'ouverture du micro.
      if (!recording.value) stopMicrophone()
    } catch {
      micError.value = 'Le micro n’est pas accessible : autorise-le pour cette appli, puis réessaie.'
      stop()
    }
  }

  function toggle() {
    if (recording.value) stop()
    else if (quiz.canAnswer.value) void start()
  }

  onBeforeUnmount(stopMicrophone)

  return { recording, live, hold, micError, toggle }
}
