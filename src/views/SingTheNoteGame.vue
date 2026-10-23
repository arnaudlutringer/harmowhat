<template>
  <game-shell
    title="Chante la note"
    :prompt="`Chante un ${quiz.question.value.name} !`"
    :quiz="quiz"
    :board="{ game: 'chante-note', level: settings.level, questions: settings.questions }"
    settings-href="/games/chante-note"
    :advance-bar="ADVANCE_DELAY"
    no-tuning-fork
  >
    <!-- Le bouton de lecture rejoue le diapason (La3) : la note demandée se trouve à partir de lui. -->
    <div class="mic">
      <p v-if="micError" class="error">
        {{ micError }}
        <ion-button size="small" @click="openMicrophone">Réessayer</ion-button>
      </p>
      <template v-else>
        <div class="target">{{ quiz.question.value.name }}</div>
        <!-- Aiguille d'accordeur : l'écart avec la note demandée, d'un demi-ton trop bas à un demi-ton trop haut. -->
        <div class="meter" :class="meterClass" aria-hidden="true">
          <span class="zone" :style="{ width: `${tolerance}%` }" />
          <span class="center" />
          <span v-if="shown" class="needle" :style="{ left: `${50 + (Math.max(-100, Math.min(100, shown.cents)) / 100) * 50}%` }" />
        </div>
        <div class="scale" aria-hidden="true"><span>trop bas</span><span>trop haut</span></div>
        <p class="sung" aria-live="polite">
          <template v-if="shown">
            {{ pitchClassName(shown.sung) }}
            <small>{{ shown.cents > 0 ? '+' : '' }}{{ shown.cents }} cents</small>
          </template>
          <template v-else>{{ listening ? 'Chante…' : quiz.feedback.value ? ' ' : 'Écoute le diapason…' }}</template>
        </p>
        <div class="hold" aria-hidden="true"><span :style="{ width: `${hold * 100}%` }" /></div>
      </template>
    </div>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton } from '@ionic/vue'
import GameShell from '@/components/GameShell.vue'
import { ADVANCE_DELAY, useQuiz } from '@/composables/useQuiz'
import { playTuningFork } from '@/audio/engine'
import { listenToMicrophone, type Listening } from '@/audio/microphone'
import type { Pitch } from '@/audio/pitch'
import { pitchClassName } from '@/music/notes'
import { createQuestion, HeldNote, judge, LEVELS, parseSettings, type Question, type Verdict } from '@/games/singTheNote'

const settings = parseSettings(useRoute().query)
const tolerance = LEVELS[settings.level].tolerance

/** Durée du diapason : on n'écoute le joueur qu'une fois qu'il s'est tu. */
const FORK_MS = 2000

let previous: Question | undefined
const quiz = useQuiz<Question>({
  total: settings.questions,
  createQuestion: () => (previous = createQuestion(settings.level, previous)),
  play: () => playTuningFork(),
  // Le décompte des points (et l'écoute) démarre à la fin du diapason.
  countdownStart: () => FORK_MS,
})

const held = new HeldNote()
/** Dernière mesure du micro (affichage en direct), puis la note retenue après la réponse. */
const live = shallowRef<Verdict | null>(null)
const result = shallowRef<Verdict | null>(null)
const hold = ref(0)
const micError = ref('')
let mic: Listening | null = null

// On écoute pendant la question, une fois le diapason éteint.
const listening = computed(() => quiz.canAnswer.value && !quiz.playing.value)
const shown = computed(() => (quiz.feedback.value ? result.value : listening.value ? live.value : null))
const meterClass = computed(() => {
  if (!shown.value) return ''
  if (quiz.feedback.value) return quiz.feedback.value.correct ? 'ok' : 'ko'
  return Math.abs(shown.value.cents) <= tolerance ? 'near' : ''
})

function onPitch(pitch: Pitch | null) {
  if (!listening.value) {
    held.reset()
    hold.value = 0
    if (!quiz.feedback.value) live.value = null
    return
  }
  const q = quiz.question.value
  live.value = pitch && pitch.clarity >= 0.85 ? judge(pitch.frequency, q, settings.level) : null
  const frequency = held.push(pitch)
  hold.value = held.progress
  if (frequency === null) return
  const verdict = judge(frequency, q, settings.level)
  result.value = verdict
  hold.value = 0
  const sung = pitchClassName(verdict.sung)
  const gap = `${Math.abs(verdict.cents)} cents trop ${verdict.cents > 0 ? 'haut' : 'bas'}`
  quiz.answer(
    verdict.correct,
    verdict.cents === 0
      ? `Tu as chanté un ${sung}, pile juste !`
      : verdict.correct
        ? `Tu as chanté un ${sung}, ${gap}.`
        : `Tu as chanté un ${sung} (${gap}), il fallait un ${q.name}.`,
  )
}

async function openMicrophone() {
  micError.value = ''
  try {
    mic = await listenToMicrophone(onPitch)
  } catch {
    micError.value = 'Le micro n’est pas accessible : autorise-le pour cette appli, puis réessaie.'
  }
}

onMounted(openMicrophone)
onBeforeUnmount(() => mic?.stop())
</script>

<style scoped>
.mic {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.target {
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  color: var(--ion-color-primary);
  margin-bottom: 20px;
}
.meter {
  position: relative;
  width: 100%;
  height: 28px;
  border-radius: 14px;
  background: rgba(108, 92, 231, 0.12);
  overflow: hidden;
}
/* Zone de justesse acceptée par le niveau, de part et d'autre du centre. */
.zone {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 168, 132, 0.25);
}
.center {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: var(--ion-color-medium);
}
.needle {
  position: absolute;
  top: 2px;
  bottom: 2px;
  width: 8px;
  border-radius: 4px;
  transform: translateX(-50%);
  background: var(--ion-color-primary);
  transition: left 0.08s linear;
}
.meter.near .needle,
.meter.ok .needle {
  background: var(--ion-color-success);
}
.meter.ko .needle {
  background: var(--ion-color-danger);
}
.scale {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 4px;
}
.sung {
  min-height: 32px;
  margin: 12px 0 8px;
  font-size: 24px;
  font-weight: 700;
}
.sung small {
  font-size: 15px;
  font-weight: 400;
  color: var(--ion-color-medium);
  margin-left: 6px;
}
/* Note tenue : la barre se remplit pendant le chant ; pleine, la note est jugée. */
.hold {
  width: 120px;
  height: 4px;
  border-radius: 2px;
  background: rgba(108, 92, 231, 0.18);
  overflow: hidden;
}
.hold span {
  display: block;
  height: 100%;
  background: var(--ion-color-primary);
  transition: width 0.05s linear;
}
.error {
  text-align: center;
  color: var(--ion-color-danger);
}
</style>
