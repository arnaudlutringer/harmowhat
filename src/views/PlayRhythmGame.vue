<template>
  <game-shell
    title="Joue le rythme"
    prompt="Lis ce rythme, puis joue-le en tapotant après le décompte."
    :quiz="quiz"
    :board="{ game: 'joue-rythme', level: settings.level, questions: settings.questions }"
    settings-href="/games/joue-rythme"
    swipe-to-next
    no-tuning-fork
  >
    <template #player>
      <div class="player">
        <rhythm-staff class="written" :cells="q.cells" :label="rhythmLabel" />
        <!-- Après la mesure : les notes attendues (traits) et les frappes (points verts dans le temps, rouges sinon). -->
        <svg v-if="verdict" class="timeline" viewBox="0 0 320 44" aria-hidden="true">
          <line x1="10" y1="22" x2="310" y2="22" class="axis" />
          <line v-for="b in BEATS + 1" :key="`b${b}`" :x1="x(b - 1)" y1="14" :x2="x(b - 1)" y2="30" class="beat" />
          <line v-for="(m, i) in verdict.matches" :key="`e${i}`" :x1="x(m.expected)" y1="6" :x2="x(m.expected)" y2="38" class="expected" />
          <template v-for="(m, i) in verdict.matches" :key="`t${i}`">
            <circle v-if="m.tap !== null" :cx="x(m.tap)" cy="22" r="6" :class="m.onTime ? 'ok' : 'ko'" />
          </template>
          <circle v-for="(t, i) in verdict.extra" :key="`x${i}`" :cx="x(t)" cy="22" r="6" class="ko" />
        </svg>
      </div>
    </template>

    <!-- Grand bouton : démarrer le décompte, puis tapoter le rythme. -->
    <button
      class="pad"
      :class="{ counting: phase === 'counting', playing: phase === 'playing' }"
      :disabled="!quiz.canAnswer.value || phase === 'done'"
      @pointerdown.prevent="onPad"
    >
      <template v-if="phase === 'ready'">▶ Démarrer</template>
      <template v-else-if="phase === 'counting'">{{ count }}</template>
      <template v-else-if="phase === 'playing'">Tape !</template>
      <template v-else>✓</template>
    </button>
    <p class="hint">{{ hint }}</p>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GameShell from '@/components/GameShell.vue'
import RhythmStaff from '@/components/RhythmStaff.vue'
import { useQuiz } from '@/composables/useQuiz'
import { BEATS, CELLS, createRhythmQuestion, judgeTaps, LEVELS, onsets, parseSettings, tapPoints, type TapVerdict } from '@/games/rhythm'
import { COUNT_IN, playRhythm } from '@/games/rhythmAudio'

const settings = parseSettings(useRoute().query)
const { tempo, tolerance } = LEVELS[settings.level]

const quiz = useQuiz({
  total: settings.questions,
  createQuestion: () => createRhythmQuestion(settings.level),
  // Rien à écouter avant : le rythme est écrit, le joueur lance lui-même le décompte.
  play: () => Promise.resolve(0),
  advanceDelay: null,
})
const q = computed(() => quiz.question.value)
const rhythmLabel = computed(() => q.value.cells.map((c) => CELLS[c].label).join(', '))

type Phase = 'ready' | 'counting' | 'playing' | 'done'
const phase = ref<Phase>('ready')
const count = ref(COUNT_IN)
const verdict = ref<TapVerdict | null>(null)
let barStart = 0
let beat = 60 / tempo
let taps: number[] = []
let timers: ReturnType<typeof setTimeout>[] = []

const clearTimers = () => timers.forEach(clearTimeout)
onBeforeUnmount(clearTimers)

watch(q, () => {
  clearTimers()
  phase.value = 'ready'
  verdict.value = null
  taps = []
})

/** Position sur la frise d'un instant (en secondes depuis le début de la mesure). */
const x = (seconds: number) => 10 + (Math.max(-0.5, Math.min(BEATS + 0.5, seconds / beat)) / BEATS) * 300

const hint = computed(() => {
  if (phase.value === 'ready') return `Décompte de ${COUNT_IN} temps au métronome, puis tape le rythme sur ce bouton.`
  if (phase.value === 'counting') return 'Prépare-toi…'
  if (phase.value === 'playing') return 'Tape chaque note du rythme !'
  return ' '
})

async function start() {
  phase.value = 'counting'
  taps = []
  const playback = await playRhythm(q.value.cells, tempo, { notes: false, clicks: true })
  barStart = playback.barStart
  beat = playback.beat
  const now = performance.now()
  // Décompte affiché au rythme des clics, puis la mesure, puis le jugement (un peu de marge pour une dernière frappe tardive).
  for (let i = 1; i < COUNT_IN; i++) timers.push(setTimeout(() => (count.value = COUNT_IN - i), barStart - now - (COUNT_IN - i) * beat * 1000))
  count.value = COUNT_IN
  timers.push(setTimeout(() => (phase.value = 'playing'), Math.max(0, barStart - now - 150)))
  timers.push(setTimeout(finish, barStart - now + (BEATS * beat + tolerance * 2) * 1000))
}

function onPad() {
  if (!quiz.canAnswer.value) return
  if (phase.value === 'ready') return void start()
  if (phase.value === 'counting' || phase.value === 'playing') taps.push((performance.now() - barStart) / 1000)
}

function finish() {
  const expected = onsets(q.value.cells).map((t) => t * beat)
  const v = judgeTaps(expected, taps, tolerance)
  verdict.value = v
  phase.value = 'done'
  const ms = Math.round(v.meanError * 1000)
  const missing = v.matches.filter((m) => !m.onTime).length
  quiz.answer(
    v.correct,
    v.correct
      ? `En rythme ! Écart moyen : ${ms} ms.`
      : missing
        ? `${missing} note${missing > 1 ? 's' : ''} pas dans le temps${v.extra.length ? `, et ${v.extra.length} frappe${v.extra.length > 1 ? 's' : ''} en trop` : ''}.`
        : `${v.extra.length} frappe${v.extra.length > 1 ? 's' : ''} en trop.`,
    tapPoints(v, tolerance),
  )
  // On entend ensuite le rythme joué juste.
  void playRhythm(q.value.cells, tempo, { notes: true, clicks: false }).catch(() => {})
}
</script>

<style scoped>
.player {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.written {
  max-width: 320px;
  padding: 6px;
  background: #fffdf3;
  color: #222;
}
.timeline {
  width: 100%;
  max-width: 320px;
  margin-top: 8px;
}
.timeline .axis {
  stroke: var(--ion-color-medium);
  stroke-width: 2;
}
.timeline .beat {
  stroke: var(--ion-color-medium);
  stroke-width: 1;
}
.timeline .expected {
  stroke: var(--ion-text-color);
  stroke-width: 3;
  stroke-linecap: round;
}
.timeline .ok {
  fill: var(--ion-color-success);
}
.timeline .ko {
  fill: var(--ion-color-danger);
}
.pad {
  width: 100%;
  height: 140px;
  margin-top: 20px;
  border: none;
  border-radius: 24px;
  background: var(--ion-color-primary);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  touch-action: manipulation;
  user-select: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(108, 92, 231, 0.35);
}
.pad:active {
  transform: scale(0.98);
}
.pad.counting {
  background: var(--ion-color-secondary);
  font-size: 56px;
}
.pad:disabled {
  opacity: 0.6;
}
.hint {
  margin: 10px 0 0;
  text-align: center;
  color: var(--ion-color-medium);
}
</style>
