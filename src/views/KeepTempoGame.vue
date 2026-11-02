<template>
  <game-shell
    title="Garde le tempo"
    prompt="Après les 3 temps du métronome, tape chaque temps sans t'arrêter."
    :quiz="quiz"
    :board="{ game: 'garde-tempo', level: settings.level, questions: 1 }"
    settings-href="/games/garde-tempo"
    no-tuning-fork
    endless
    :answers-label="summary"
    :advance-bar="ADVANCE_MS"
    :score-ratio="quiz.totalPoints.value / STAGE_POINTS"
  >
    <template #player>
      <div class="player">
        <p class="tempo">
          ♩ = <strong>{{ q.tempo }}</strong> <small>{{ tempoName(q.tempo) }}</small>
        </p>
        <!-- Avancée du palier de 30 secondes. -->
        <div class="stage" aria-hidden="true"><span :style="{ width: `${progress * 100}%` }" /></div>
        <p class="stage-points">{{ stageScore.toLocaleString('fr-FR') }} / 10 000 pts</p>
        <p class="last" :class="last?.ok ? 'ok' : last ? 'ko' : ''" aria-live="polite">{{ last?.text ?? ' ' }}</p>
      </div>
    </template>

    <!-- Grand bouton : chaque temps se tape ici. -->
    <button
      class="pad"
      :class="{ counting: phase === 'counting', flash }"
      :disabled="phase === 'failed' || phase === 'held'"
      @pointerdown.prevent="tap"
    >
      <template v-if="phase === 'counting'">{{ count }}</template>
      <template v-else-if="phase === 'playing'">{{ beatsLeft }}</template>
      <template v-else-if="phase === 'held'">✓</template>
      <template v-else-if="phase === 'failed'">✗</template>
      <template v-else>…</template>
    </button>
    <p class="hint">{{ hint }}</p>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GameShell from '@/components/GameShell.vue'
import { useQuiz } from '@/composables/useQuiz'
import { COUNT_IN, playRhythm } from '@/games/rhythmAudio'
import { judgeBeat, KEEP_LEVELS, parseKeepSettings, STAGE_POINTS, STAGE_SECONDS, stageBeats, stageTempo, tempoName } from '@/games/tempo'
import { trophyEvent } from '@/games/trophies'

const settings = parseKeepSettings(useRoute().query)
const { tolerance } = KEEP_LEVELS[settings.level]
/** Pause entre deux paliers, avant le décompte du tempo suivant. */
const ADVANCE_MS = 1800

type Phase = 'waiting' | 'counting' | 'playing' | 'held' | 'failed'
const phase = ref<Phase>('waiting')
const count = ref(COUNT_IN)
const progress = ref(0)
const flash = ref(false)
const last = ref<{ ok: boolean; text: string } | null>(null)
let stageIndex = () => 0
let barStart = 0
let beat = 1
let done = new Set<number>()
let errors: number[] = []
let timers: ReturnType<typeof setTimeout>[] = []
let monitor: ReturnType<typeof setInterval> | undefined
/** Tempos des paliers tenus pendant la partie (trophées). */
let held: number[] = []

const quiz = useQuiz({
  // Pas de nombre de questions : un palier après l'autre, jusqu'à la première erreur.
  total: 999,
  createQuestion: () => ({ tempo: stageTempo(settings.level, stageIndex()) }),
  play: (q) => startStage(q.tempo),
  untimed: true,
  advanceDelay: ADVANCE_MS,
})
stageIndex = () => quiz.index.value
const q = computed(() => quiz.question.value)
const beats = computed(() => stageBeats(q.value.tempo))
const hits = ref(0)
const beatsLeft = computed(() => Math.max(0, beats.value - hits.value))
// Chaque temps tenu rapporte 10 000 / (nombre de temps du palier) : un palier complet vaut 10 000 points.
const stageScore = computed(() => Math.round((hits.value * STAGE_POINTS) / beats.value))

const summary = computed(() => {
  const n = quiz.results.value.filter((r) => r.correct).length
  if (!n) return 'Aucun palier de 30 secondes tenu'
  const seconds = n * STAGE_SECONDS
  const time = seconds >= 60 ? `${Math.floor(seconds / 60)} min${seconds % 60 ? ` ${seconds % 60} s` : ''}` : `${seconds} s`
  return `${n} palier${n > 1 ? 's' : ''} tenu${n > 1 ? 's' : ''} : ${time} en rythme`
})

const hint = computed(() => {
  if (phase.value === 'counting') return 'Écoute le métronome…'
  if (phase.value === 'playing') return 'Garde le tempo : un temps, une frappe.'
  if (phase.value === 'held') return 'Palier tenu ! Nouveau tempo…'
  if (phase.value === 'failed') return 'Partie terminée.'
  return ' '
})

function clearAll() {
  timers.forEach(clearTimeout)
  timers = []
  clearInterval(monitor)
  monitor = undefined
}
onBeforeUnmount(clearAll)

// Nouvelle partie : on repart du premier palier.
watch(
  () => quiz.results.value.length,
  (n) => n === 0 && (held = []),
)

/** Un palier : 3 temps de métronome, puis le joueur tape seul pendant 30 secondes. */
async function startStage(tempo: number): Promise<number> {
  clearAll()
  phase.value = 'counting'
  done = new Set()
  hits.value = 0
  errors = []
  progress.value = 0
  last.value = null
  const playback = await playRhythm([], tempo, { notes: false })
  barStart = playback.barStart
  beat = playback.beat
  const now = performance.now()
  count.value = COUNT_IN
  for (let i = 1; i < COUNT_IN; i++) timers.push(setTimeout(() => (count.value = COUNT_IN - i), barStart - now - (COUNT_IN - i) * beat * 1000))
  // Le bouton passe à « Tape ! » 350 ms avant le premier temps : on peut taper le premier temps sans hésiter.
  timers.push(setTimeout(() => (phase.value = 'playing'), Math.max(0, barStart - now - 350)))
  // Un temps passé sans frappe (au-delà de la tolérance) arrête la partie.
  monitor = setInterval(() => {
    if (phase.value !== 'playing' && phase.value !== 'counting') return
    const t = (performance.now() - barStart) / 1000
    const next = done.size
    progress.value = Math.min(1, Math.max(0, t / (beats.value * beat)))
    if (next < beats.value && t > next * beat + tolerance) fail('Un temps a été oublié.')
  }, 30)
  return COUNT_IN * beat
}

function tap() {
  if (phase.value !== 'playing' && phase.value !== 'counting') return
  const t = (performance.now() - barStart) / 1000
  // Frappes pendant le décompte (avant le premier temps) : ignorées.
  if (t < -tolerance) return
  const { index, error, ok } = judgeBeat(t, beat, tolerance, done)
  const ms = Math.round(error * 1000)
  if (!ok) return fail(done.has(index) ? 'Deux frappes sur le même temps.' : `Trop ${error < 0 ? 'tôt' : 'tard'} : ${Math.abs(ms)} ms d'écart.`)
  done.add(index)
  hits.value = done.size
  errors.push(Math.abs(error))
  flash.value = false
  requestAnimationFrame(() => (flash.value = true))
  last.value = { ok: true, text: Math.abs(ms) <= 20 ? 'Pile !' : `${ms > 0 ? '+' : '−'}${Math.abs(ms)} ms` }
  if (done.size >= beats.value) succeed()
}

function succeed() {
  clearAll()
  phase.value = 'held'
  held.push(q.value.tempo)
  const mean = errors.reduce((s, e) => s + e, 0) / errors.length
  quiz.answer(true, `Palier tenu à ♩ = ${q.value.tempo}, à ${Math.round(mean * 1000)} ms près en moyenne.`, STAGE_POINTS)
}

function fail(reason: string) {
  clearAll()
  phase.value = 'failed'
  last.value = { ok: false, text: reason }
  // On laisse le temps de lire ce qui s'est passé, puis le bilan. Les temps tenus du palier entamé comptent quand même.
  const partial = stageScore.value
  timers.push(
    setTimeout(() => {
      if (partial > 0 || !quiz.results.value.length || quiz.trial) quiz.answer(false, reason, partial)
      trophyEvent({ type: 'tempo-run', tempos: [...held] })
      if (!quiz.trial) quiz.finish()
    }, 2000),
  )
}
</script>

<style scoped>
.player {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tempo {
  margin: 0;
  font-size: 22px;
}
.tempo strong {
  font-size: 40px;
  color: var(--ion-color-primary);
}
.tempo small {
  color: var(--ion-color-medium);
  font-style: italic;
}
.stage {
  width: 100%;
  max-width: 320px;
  height: 8px;
  margin: 12px 0 6px;
  background: rgba(108, 92, 231, 0.15);
}
.stage span {
  display: block;
  height: 100%;
  background: var(--ion-color-primary);
}
.stage-points {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-color-primary);
}
.last {
  min-height: 24px;
  margin: 0 0 8px;
  font-weight: 600;
}
.last.ok {
  color: var(--ion-color-success);
}
.last.ko {
  color: var(--ion-color-danger);
}
.pad {
  width: 100%;
  height: 160px;
  margin-top: 12px;
  border: none;
  border-radius: 24px;
  background: var(--ion-color-primary);
  color: #fff;
  font-size: 48px;
  font-weight: 700;
  touch-action: manipulation;
  user-select: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(108, 92, 231, 0.35);
}
.pad.counting {
  background: var(--ion-color-secondary);
  font-size: 64px;
}
.pad.flash {
  animation: hit 0.15s ease-out;
}
@keyframes hit {
  50% {
    transform: scale(0.97);
    filter: brightness(1.2);
  }
}
.pad:disabled {
  opacity: 0.6;
}
/* Hauteur fixe (deux lignes) : le texte change ou disparaît sans faire bouger l'écran. */
.hint {
  min-height: 40px;
  margin: 10px 0 0;
  text-align: center;
  color: var(--ion-color-medium);
}
</style>
