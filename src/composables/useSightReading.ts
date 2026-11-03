import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import type { StaffNote } from '@/components/ScrollingStaff.vue'
import { NoteStream, notePoints, noteName, tempoAfter, WINDOW_BEATS, type Level } from '@/games/sightReading'
import type { useQuiz } from './useQuiz'

/** Temps d'approche avant que la première note n'atteigne la barre de lecture. */
const LEAD_IN_BEATS = 3
/** Notes tirées d'avance, après la note à lire (celles qu'on voit arriver). */
const AHEAD = 6
/** Temps laissé pour lire le message de fin avant le bilan. */
const END_DELAY_MS = 2000

/**
 * Moteur commun des jeux de lecture en défilement : les notes avancent d'un temps par battement du tempo ;
 * la note à lire se dit pendant qu'elle est entre les deux barres violettes, avant d'atteindre celle de gauche
 * (plus `latency` secondes, le temps que le micro reconnaisse la réponse). Chaque bonne réponse accélère le tempo.
 */
export function useSightReading(
  quiz: Pick<ReturnType<typeof useQuiz>, 'answer' | 'finish' | 'trial'>,
  level: Level,
  latency: number,
) {
  type Phase = 'waiting' | 'running' | 'over'
  const phase = ref<Phase>('waiting')
  const notes = shallowRef<StaffNote[]>([])
  const position = ref(-LEAD_IN_BEATS)
  const tempo = ref(tempoAfter(level, 0))
  const read = ref(0)
  const points = ref(0)
  /** Fin de partie : ce qui s'est passé. */
  const reason = ref('')
  let target = 0
  let stream = new NoteStream(level)
  let frame: number | undefined
  let last = 0
  let endTimer: ReturnType<typeof setTimeout> | undefined
  /** Plus haut tempo atteint (trophées, bilan). */
  const topTempo = ref(tempo.value)

  const current = computed(() => notes.value.find((n) => n.index === target)?.note ?? null)

  function fill() {
    const list = notes.value.filter((n) => n.index >= target - 5)
    let nextIndex = list.length ? list[list.length - 1].index + 1 : 0
    while (nextIndex <= target + AHEAD) list.push({ index: nextIndex++, note: stream.next(), state: 'todo' })
    notes.value = list
  }

  function mark(index: number, state: StaffNote['state']) {
    notes.value = notes.value.map((n) => (n.index === index ? { ...n, state } : n))
  }

  function stopLoop() {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
  }

  function step(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    position.value += (dt * tempo.value) / 60
    // La note doit être lue avant d'atteindre la barre de gauche ; on laisse en plus au micro le temps de reconnaître la réponse.
    const grace = (latency * tempo.value) / 60
    if (position.value > target + grace) {
      mark(target, 'ko')
      const n = current.value
      return end(`Note oubliée : c'était ${n ? noteName(n) : '?'}.`)
    }
    frame = requestAnimationFrame(step)
  }

  /** Lance le défilement (après le compte à rebours) ; renvoie 0, comme un son immédiat. */
  function start(): Promise<number> {
    stopLoop()
    clearTimeout(endTimer)
    stream = new NoteStream(level)
    notes.value = []
    target = 0
    read.value = 0
    points.value = 0
    reason.value = ''
    tempo.value = tempoAfter(level, 0)
    topTempo.value = tempo.value
    position.value = -LEAD_IN_BEATS
    fill()
    phase.value = 'running'
    last = performance.now()
    frame = requestAnimationFrame(step)
    return Promise.resolve(0)
  }

  /**
   * Réponse du joueur (classe de note, 0 = Do) ; `said` décrit ce qu'il a chanté ou dit.
   * Renvoie false si la réponse arrive trop tôt (aucune note à portée) et n'a pas été prise en compte.
   */
  function submit(pc: number, said: string): boolean {
    if (phase.value !== 'running') return false
    const n = current.value
    if (!n || target - position.value > WINDOW_BEATS + 0.1) return false
    if (pc !== n.pc) {
      mark(target, 'ko')
      end(`${said}, mais c'était ${noteName(n)}.`)
      return true
    }
    mark(target, 'ok')
    points.value += notePoints(tempo.value)
    read.value++
    tempo.value = tempoAfter(level, read.value)
    topTempo.value = Math.max(topTempo.value, tempo.value)
    target++
    fill()
    return true
  }

  function end(why: string) {
    stopLoop()
    phase.value = 'over'
    reason.value = why
    const scored = points.value
    endTimer = setTimeout(() => {
      quiz.answer(false, why, scored)
      if (!quiz.trial) quiz.finish()
    }, END_DELAY_MS)
  }

  /** Arrêt sans bilan (sortie du jeu). */
  function stop() {
    stopLoop()
    clearTimeout(endTimer)
  }

  onBeforeUnmount(stop)

  return { phase, notes, position, tempo, topTempo, read, points, reason, current, start, submit, stop }
}
