import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import type { StaffNote } from '@/components/ScrollingStaff.vue'
import { NoteStream, notePoints, noteName, tempoAfter, READ_AHEAD_BEATS, type Level } from '@/games/sightReading'
import type { useQuiz } from './useQuiz'

/** Temps d'approche avant que la première note n'atteigne la barre de lecture. */
const LEAD_IN_BEATS = 3
/** Notes tirées d'avance, après la note à lire (celles qu'on voit arriver). */
const AHEAD = 6
/** Temps laissé pour lire le message de fin avant le bilan. */
const END_DELAY_MS = 2000
/** Retard toléré sur la barre de gauche, en temps, pour une réponse datée de son attaque. */
const ONSET_SLACK_BEATS = 0.3
/** Délai le plus long entre l'attaque d'une note dite et l'arrivée du mot reconnu. */
const MAX_RECOGNITION_MS = 3000

/**
 * Moteur commun des jeux de lecture en défilement : les notes avancent d'un temps par battement du tempo ;
 * la note à lire se dit dès qu'elle apparaît, avant d'atteindre la barre violette
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
  /** Position de la portée au fil du temps (dernières secondes), pour dater une réponse de son attaque. */
  let history: { t: number; p: number }[] = []
  /** Attaques de la voix pas encore associées à un mot reconnu (horloge performance.now()). */
  let onsets: number[] = []
  /** Mode « attaques » : les réponses sont jugées au moment où le joueur a commencé à les dire. */
  let timed = false

  /** Position de la portée à l'instant `t`. */
  function positionAt(t: number): number {
    for (let i = history.length - 1; i > 0; i--) {
      const a = history[i - 1]
      const b = history[i]
      if (a.t <= t) return b.t === a.t ? b.p : a.p + ((b.p - a.p) * (Math.min(t, b.t) - a.t)) / (b.t - a.t)
    }
    return history.length ? history[0].p : position.value
  }

  /** L'instant `t` tombe-t-il pendant que la note `index` était visible, avant la barre (ou juste après) ? */
  const inWindow = (t: number, index: number) => {
    const p = positionAt(t)
    return p >= index - READ_AHEAD_BEATS && p <= index + ONSET_SLACK_BEATS
  }

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
    history.push({ t: now, p: position.value })
    while (history.length > 2 && now - history[0].t > 6000) history.shift()
    if (timed) {
      // Une attaque restée sans mot reconnu trop longtemps : bruit, ou mot pas compris.
      const stale = onsets.length > 0 && now - onsets[0] > MAX_RECOGNITION_MS
      onsets = onsets.filter((t) => now - t <= MAX_RECOGNITION_MS)
      // La note a passé la barre : on attend encore le mot si le joueur a commencé à la dire à temps.
      if (position.value > target + ONSET_SLACK_BEATS && !onsets.some((t) => inWindow(t, target))) {
        mark(target, 'ko')
        const n = current.value
        return end(`${stale ? 'Pas compris à temps' : 'Note oubliée'} : c'était ${n ? noteName(n) : '?'}.`)
      }
      frame = requestAnimationFrame(step)
      return
    }
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
    history = []
    onsets = []
    fill()
    phase.value = 'running'
    last = performance.now()
    history.push({ t: last, p: position.value })
    frame = requestAnimationFrame(step)
    return Promise.resolve(0)
  }

  /**
   * Réponse du joueur (classe de note, 0 = Do) ; `said` décrit ce qu'il a chanté ou dit.
   * Les notes se disent dans l'ordre, aussi tôt que le joueur le peut. Renvoie false si la réponse n'a pas été prise en compte.
   */
  function submit(pc: number, said: string): boolean {
    if (phase.value !== 'running') return false
    const n = current.value
    if (!n) return false
    if (timed) {
      // La réponse est datée de la première attaque tombée pendant que la note était visible ;
      // les attaques plus anciennes (bruit, réponse trop tôt) sont oubliées.
      const at = onsets.findIndex((t) => inWindow(t, target))
      if (at >= 0) onsets.splice(0, at + 1)
      else {
        // Pas d'attaque à temps (notes enchaînées sans creux de voix, par exemple) : on date le mot de son arrivée,
        // moins le temps habituel de reconnaissance.
        const p = position.value - (latency * tempo.value) / 60
        if (p > target + ONSET_SLACK_BEATS) {
          mark(target, 'ko')
          end(`Trop tard : c'était ${noteName(n)}.`)
          return true
        }
      }
    }
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

  /** Attaque de la voix à l'instant `t` (performance.now()) : passe le jeu en mode « attaques ». */
  function onset(t: number) {
    timed = true
    if (phase.value !== 'running') return
    // Avant que la note à lire n'apparaisse : ce n'est pas une réponse.
    if (positionAt(t) < target - READ_AHEAD_BEATS) return
    onsets.push(t)
  }

  /** Oublie les attaques d'avant `t` restées sans mot (fin d'une phrase de la reconnaissance vocale). */
  function forgetOnsets(t: number) {
    onsets = onsets.filter((o) => o >= t)
  }

  onBeforeUnmount(stop)

  return { phase, notes, position, tempo, topTempo, read, points, reason, current, start, submit, stop, onset, forgetOnsets }
}
