import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { COUNTDOWN_DELAY_MS, GRACE_MS, MIN_POINTS, QuestionClock, REPLAY_PENALTY, summarize, TUNING_FORK_PENALTY, type QuestionResult } from '@/games/scoring'
import { usePlaying } from './usePlaying'
import { useRoute } from 'vue-router'
import { stopAll } from '@/audio/engine'
import { isTrial } from '@/games/ready'
import { trophyEvent } from '@/games/trophies'

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
  /**
   * Délai entre le début du premier son et le début du décompte des points (ms), par défaut 50 ms.
   * Avec ce réglage, les réponses ne s'ouvrent qu'à ce moment-là (ex. la dernière note d'une gamme).
   */
  countdownStart?: (question: Q) => number
  /** Avec `countdownStart` : ouvre les réponses plus tôt, ce délai (ms) après le début du premier son. */
  answersOpen?: (question: Q) => number
}

/**
 * Déroulé commun des mini-jeux : N questions jouées automatiquement, points par question
 * (voir games/scoring.ts), message après chaque réponse, bilan en fin de partie.
 */
/** Délai du passage automatique à la question suivante, après une réponse (ms). */
export const ADVANCE_DELAY = 1500

export function useQuiz<Q>({ total = 20, createQuestion, play, advanceDelay = ADVANCE_DELAY, countdownStart, answersOpen }: QuizOptions<Q>) {
  // Mode essai (`essai=1` dans l'adresse du jeu) : une seule question, sans passage automatique ni score.
  const trial = getCurrentInstance() ? isTrial(useRoute()?.query ?? {}) : false
  if (trial) {
    total = 1
    advanceDelay = null
  }
  const index = ref(0)
  const question = shallowRef<Q>(createQuestion())
  const hasListened = ref(false)
  const feedback = ref<Feedback | null>(null)
  const finished = ref(false)
  const results = ref<QuestionResult[]>([])
  const points = ref(0)
  /** Le diapason a servi pendant la partie (trophée « Sans filet »). */
  const forkUsed = ref(false)
  /** Compte à rebours avant la première question (3, 2, 1), null le reste du temps. */
  const countdown = ref<number | null>(null)
  const sound = usePlaying()
  let clock = new QuestionClock()
  let plays = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let clockTimer: ReturnType<typeof setTimeout> | undefined
  let openTimer: ReturnType<typeof setTimeout> | undefined
  let countdownTimer: ReturnType<typeof setTimeout> | undefined
  let frame: number | undefined
  /** Partie en pause (popin « Quitter la partie ? ») ; startPending : le décompte devait démarrer pendant la pause. */
  let paused = false
  let startPending = false

  const number = computed(() => index.value + 1)
  const canAnswer = computed(() => hasListened.value && !feedback.value && !finished.value)
  const summary = computed(() => summarize(results.value))
  const score = computed(() => summary.value.correct)
  const totalPoints = computed(() => summary.value.points)
  const questionOpen = () => !feedback.value && !finished.value
  /** La pénalité de réécoute retire encore des points : sinon, on n'annonce plus « Réécouter (−200 pts) ». */
  const replayCosts = computed(() => points.value - REPLAY_PENALTY > MIN_POINTS)

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
   * 50 ms après le début du son (ou au délai propre au jeu), plus une marge de 0,3 s pendant laquelle
   * on peut déjà répondre ; chaque réécoute coûte 200 points.
   */
  function listen(): Promise<void> {
    const q = question.value
    const first = plays++ === 0
    if (!first && questionOpen()) clock.penalize(REPLAY_PENALTY)
    tick()
    return sound
      .track(play(q))
      .then(() => {
        if (question.value !== q || !questionOpen()) return
        // Délai propre au jeu : les réponses s'ouvrent avec le décompte ; sinon, dès le début du son.
        if (!countdownStart || !first) hasListened.value = true
        if (!first) return
        const c = clock
        // Les réponses s'ouvrent avant le décompte (au moins GRACE_MS avant) : répondre pendant cette marge
        // rapporte les 10 000 points.
        if (countdownStart) {
          openTimer = setTimeout(() => {
            if (c === clock && questionOpen()) hasListened.value = true
          }, answersOpen ? answersOpen(q) : countdownStart(q))
        }
        const clockAt = (countdownStart ? countdownStart(q) : COUNTDOWN_DELAY_MS) + (answersOpen ? 0 : GRACE_MS)
        clockTimer = setTimeout(() => {
          if (c !== clock) return
          hasListened.value = true
          if (paused) return void (startPending = true)
          c.start()
          tick()
        }, clockAt)
      })
      .catch(() => {})
  }

  /** Coup de diapason pendant une question : 100 points de moins. */
  function penalizeTuningFork() {
    if (!questionOpen()) return
    forkUsed.value = true
    clock.penalize(TUNING_FORK_PENALTY)
    tick()
  }

  function answer(correct: boolean, message: string) {
    if (!canAnswer.value) return
    stopTicking()
    points.value = clock.stop()
    results.value = [...results.value, { correct, points: correct ? points.value : 0 }]
    feedback.value = { correct, message }
    if (trial) trophyEvent({ type: 'trial' })
    if (advanceDelay !== null) timer = setTimeout(next, advanceDelay)
  }

  /** Affiche 3, 2, 1 (une seconde chacun), puis joue la première question. */
  function countdownStep() {
    if (countdown.value === null || paused) return
    if (countdown.value > 1) {
      countdown.value--
      countdownTimer = setTimeout(countdownStep, 1000)
    } else {
      countdown.value = null
      void listen()
    }
  }

  function startCountdown() {
    clearTimeout(countdownTimer)
    countdown.value = 3
    countdownTimer = setTimeout(countdownStep, 1000)
  }

  /** Met la partie en pause : les points de la question ne baissent plus, le compte à rebours s'arrête. */
  function pause() {
    if (paused || finished.value) return
    paused = true
    clearTimeout(countdownTimer)
    clock.pause()
    stopTicking()
    points.value = clock.points
  }

  /** Reprend la partie là où elle en était. */
  function resume() {
    if (!paused) return
    paused = false
    if (startPending) {
      startPending = false
      clock.start()
    }
    clock.resume()
    tick()
    if (countdown.value !== null) countdownTimer = setTimeout(countdownStep, 1000)
  }

  function startQuestion(first = false) {
    stopTicking()
    clearTimeout(clockTimer)
    clearTimeout(openTimer)
    stopAll()
    clock = new QuestionClock()
    startPending = false
    plays = 0
    points.value = clock.points
    question.value = createQuestion()
    hasListened.value = false
    feedback.value = null
    if (first) startCountdown()
    else void listen()
  }

  function next() {
    clearTimeout(timer)
    if (index.value + 1 >= total) {
      finished.value = true
      clearTimeout(clockTimer)
      clearTimeout(openTimer)
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
    forkUsed.value = false
    finished.value = false
    startQuestion(true)
  }

  if (getCurrentInstance()) {
    // La première question est jouée dès la fin du compte à rebours.
    onMounted(() => {
      points.value = clock.points
      startCountdown()
    })
    onBeforeUnmount(() => {
      clearTimeout(timer)
      clearTimeout(clockTimer)
      clearTimeout(openTimer)
      clearTimeout(countdownTimer)
      stopTicking()
      stopAll()
    })
  }

  return {
    trial,
    forkUsed,
    total, index, number, score, points, totalPoints, results, question, hasListened, feedback, finished, canAnswer, countdown,
    playing: sound.playing, replayCosts, replayPenalty: REPLAY_PENALTY, listen, penalizeTuningFork, answer, next, restart, pause, resume,
  }
}
