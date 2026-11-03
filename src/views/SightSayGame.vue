<template>
  <game-shell
    title="Lecture continue"
    prompt="Dis le nom de chaque note avant qu'elle ne passe la barre violette."
    :quiz="quiz"
    :board="{ game: 'lis-dis', level: settings.level, questions: 1 }"
    settings-href="/games/lis-dis"
    no-tuning-fork
    endless
    :answers-label="summary"
    :score-ratio="sight.points.value / SIGHT_MEDAL_POINTS"
    :live-points="sight.points.value"
    :progress-label="readLabel"
  >
    <template #player>
      <div class="player">
        <p class="tempo">
          ♩ = <strong>{{ sight.tempo.value }}</strong> <small>{{ tempoName(sight.tempo.value) }}</small>
        </p>
        <scrolling-staff
          :notes="sight.notes.value"
          :position="sight.position.value"
          :clef="sight.current.value?.clef ?? 'sol'"
          :label="sight.current.value ? `${clefLabel(sight.current.value.clef)}, note à lire` : 'Portée'"
        />
        <p class="status" :class="{ ko: sight.phase.value === 'over' }" aria-live="polite">{{ status }}</p>
        <p v-if="micError" class="error">{{ micError }}</p>
        <!-- Ce que la reconnaissance vocale a entendu, pour comprendre une réponse refusée. -->
        <p class="heard">{{ heard ? `« ${heard} »` : ' ' }}</p>
      </div>
    </template>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GameShell from '@/components/GameShell.vue'
import ScrollingStaff from '@/components/ScrollingStaff.vue'
import { useQuiz } from '@/composables/useQuiz'
import { useSightReading } from '@/composables/useSightReading'
import { listenToSpeech, type SpeechListening } from '@/audio/speech'
import { pitchClassName } from '@/music/notes'
import { clefLabel, parseSightSettings, parseSpokenNotes, SIGHT_LEVELS, SIGHT_MEDAL_POINTS, tempoAfter } from '@/games/sightReading'
import { tempoName } from '@/games/tempo'
import { trophyEvent } from '@/games/trophies'

const settings = parseSightSettings(useRoute().query)
const { accidentals } = SIGHT_LEVELS[settings.level]

const quiz = useQuiz({
  total: 1,
  createQuestion: () => ({}),
  play: () => begin(),
  untimed: true,
  advanceDelay: null,
})
// La reconnaissance vocale rend le mot avec un peu de retard : 0,9 s de marge après la barre.
const sight = useSightReading(quiz, settings.level, 0.9)

const heard = ref('')
const micError = ref('')
let speech: SpeechListening | null = null
/** Séance de reconnaissance en cours, et nombre de notes déjà jugées dans son texte. */
let session = -1
let consumed = 0
/** Une lettre seule en fin de phrase (« fa… ») : on attend un instant un éventuel « dièse » ou « bémol ». */
let pending: ReturnType<typeof setTimeout> | undefined
const ACCIDENTAL_WAIT_MS = 350

function stopSpeech() {
  clearTimeout(pending)
  speech?.stop()
  speech = null
}
onBeforeUnmount(stopSpeech)

function judge(pc: number) {
  consumed++
  sight.submit(pc, `Tu as dit ${pitchClassName(pc)}`)
}

function onSpeech(text: string, s: number, final: boolean) {
  if (sight.phase.value !== 'running') return
  if (s !== session) {
    session = s
    consumed = 0
  }
  heard.value = text
  clearTimeout(pending)
  const said = parseSpokenNotes(text)
  for (let i = consumed; i < said.length && sight.phase.value === 'running'; i++) {
    const n = said[i]
    if (accidentals && !n.altered && !final && i === said.length - 1) {
      pending = setTimeout(() => {
        if (session === s && consumed === i && sight.phase.value === 'running') judge(n.pc)
      }, ACCIDENTAL_WAIT_MS)
      return
    }
    judge(n.pc)
  }
}

async function begin(): Promise<number> {
  const started = sight.start()
  micError.value = ''
  heard.value = ''
  if (!speech) {
    try {
      speech = await listenToSpeech(onSpeech)
    } catch {
      micError.value = 'La reconnaissance vocale n’est pas accessible : autorise le micro pour cette appli, puis réessaie.'
    }
  }
  return started
}

watch(sight.phase, (phase) => {
  if (phase !== 'over') return
  stopSpeech()
  trophyEvent({ type: 'sight-run', game: 'lis-dis', notes: sight.read.value, tempo: tempoAfter(settings.level, Math.max(0, sight.read.value - 1)) })
})

const readLabel = computed(() => `${sight.read.value} note${sight.read.value > 1 ? 's' : ''} lue${sight.read.value > 1 ? 's' : ''}`)
const summary = computed(() => `${readLabel.value}, jusqu'à ♩ = ${sight.topTempo.value}`)
const status = computed(() => {
  if (sight.phase.value === 'over') return sight.reason.value
  if (sight.position.value < 0) return 'Les notes arrivent… prépare-toi à les nommer.'
  return 'Dis « do », « fa dièse », « si bémol »…'
})
</script>

<style scoped>
.player {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tempo {
  margin: 0 0 10px;
  font-size: 20px;
}
.tempo strong {
  font-size: 34px;
  color: var(--ion-color-primary);
}
.tempo small {
  color: var(--ion-color-medium);
  font-style: italic;
}
.status {
  min-height: 44px;
  margin: 14px 0 4px;
  text-align: center;
  font-weight: 600;
  color: var(--ion-color-medium);
}
.status.ko {
  color: var(--ion-color-danger);
}
.error {
  text-align: center;
  color: var(--ion-color-danger);
}
.heard {
  min-height: 24px;
  margin: 0;
  color: var(--ion-color-medium);
  font-style: italic;
  text-align: center;
}
</style>
