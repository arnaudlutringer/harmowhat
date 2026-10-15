import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { QuestionClock, REPLAY_PENALTY, summarize, TUNING_FORK_PENALTY, type QuestionResult } from '@/games/scoring'
import { usePlaying } from './usePlaying'
import { stopAll } from '@/audio/engine'

export interface Feedback {
  correct: boolean
  message: string
}

export interface QuizOptions<Q> {
  /** Nombre de questions par partie. */
  total?: number
  /** Fabrique une nouvelle question. */
  createQuestion: () => Q
  /** Joue la note ou l'accord à trouver ; se résout au démarrage du son avec sa durée en secondes. */
  play: (question: Q) => Promise<number>
  /** Délai avant de passer à la question suivante après une réponse (ms), ou null pour attendre le joueur. */
  advanceDelay?: number | null
}

/**
 * Déroulé commun des mini-jeux : N questions jouées automatiquement, points par question
 * (voir games/scoring.ts), message après chaque réponse, bilan en fin de partie.
 */
export function useQuiz<Q>({ total = 20, createQuestion, play, advanceDelay = 1600 }: QuizOptions<Q>) {
  const index = ref(0)
  const question = shallowRef<Q>(createQuestion())
  const hasListened = ref(false)
  const feedback = ref<Feedback | null>(null)
  const finished = ref(false)
  const results = ref<QuestionResult[]>([])
  const points = ref(0)
  const sound = usePlaying()
  let clock = new QuestionClock()
  let plays = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let clockTimer: ReturnType<typeof setTimeout> | undefined
  let frame: number | undefined

  const number = computed(() => index.value + 1)
  const canAnswer = computed(() => hasListened.value && !feedback.value && !finished.value)
  const summary = computed(() => summarize(results.value))
  const score = computed(() => summary.value.correct)
  const totalPoints = computed(() => summary.value.points)
  const questionOpen = () => !feedback.value && !finished.value

  // Rafraîchit l'affichage des points tant que le chronomètre tourne.
  function tick() {
    points.value = clock.points
    frame = clock.running && typeof requestAnimationFrame === 'function' ? requestAnimationFrame(tick) : undefined
  }

  function stopTicking() {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
  }

  /**
   * Joue la question. La première écoute est gratuite et le décompte des points démarre
   * quand elle se termine ; chaque réécoute coûte 100 points.
   */
  function listen(): Promise<void> {
    const q = question.value
    const first = plays++ === 0
    if (!first && questionOpen()) clock.penalize(REPLAY_PENALTY)
    tick()
    return sound
      .track(play(q))
      .then((seconds) => {
        if (question.value !== q || !questionOpen()) return
        hasListened.value = true
        if (!first) return
        const c = clock
        clockTimer = setTimeout(() => {
          if (c !== clock) return
          c.start()
          tick()
        }, seconds * 1000)
      })
      .catch(() => {})
  }

  /** Coup de diapason pendant une question : 100 points de moins. */
  function penalizeTuningFork() {
    if (!questionOpen()) return
    clock.penalize(TUNING_FORK_PENALTY)
    tick()
  }

  function answer(correct: boolean, message: string) {
    if (!canAnswer.value) return
    stopTicking()
    points.value = clock.stop()
    results.value = [...results.value, { correct, points: correct ? points.value : 0 }]
    feedback.value = { correct, message }
    if (advanceDelay !== null) timer = setTimeout(next, advanceDelay)
  }

  function startQuestion() {
    stopTicking()
    clearTimeout(clockTimer)
    stopAll()
    clock = new QuestionClock()
    plays = 0
    points.value = clock.points
    question.value = createQuestion()
    hasListened.value = false
    feedback.value = null
    void listen()
  }

  function next() {
    clearTimeout(timer)
    if (index.value + 1 >= total) {
      finished.value = true
      clearTimeout(clockTimer)
      stopAll()
      return
    }
    index.value++
    startQuestion()
  }

  /** Nouvelle partie avec les mêmes réglages. */
  function restart() {
    clearTimeout(timer)
    index.value = 0
    results.value = []
    finished.value = false
    startQuestion()
  }

  if (getCurrentInstance()) {
    // La première question est jouée dès l'arrivée sur l'écran.
    onMounted(() => {
      points.value = clock.points
      void listen()
    })
    onBeforeUnmount(() => {
      clearTimeout(timer)
      clearTimeout(clockTimer)
      stopTicking()
      stopAll()
    })
  }

  return {
    total, index, number, score, points, totalPoints, results, question, hasListened, feedback, finished, canAnswer,
    playing: sound.playing, listen, penalizeTuningFork, answer, next, restart,
  }
}
