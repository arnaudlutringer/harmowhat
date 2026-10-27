<template>
  <game-shell
    title="Chante la note"
    :prompt="`Chante un ${quiz.question.value.name} !`"
    :quiz="quiz"
    :board="{ game: 'chante-note', level: settings.level, questions: settings.questions }"
    settings-href="/games/chante-note"
    :advance-bar="ADVANCE_DELAY"
    :no-tuning-fork="settings.level === 'expert'"
  >
    <!-- Pas de son à écouter : le bouton lance l'enregistrement de la voix, et le score est en pause pendant la prise. -->
    <template #player>
      <button
        class="play record"
        :class="{ 'is-playing': recording }"
        :aria-label="recording ? 'Arrêter l’enregistrement' : 'Chanter : démarrer l’enregistrement'"
        :disabled="!quiz.canAnswer.value"
        @click="toggle"
      >
        <ion-icon :icon="recording ? stop : mic" />
      </button>
      <p class="hint">{{ hint }}</p>
    </template>

    <div class="mic">
      <p v-if="micError" class="error">{{ micError }}</p>
      <template v-else>
        <!-- Accordeur : l'écart avec la note demandée, d'un demi-ton trop bas à un demi-ton trop haut. -->
        <tuner-gauge
          :cents="shown?.cents ?? null"
          :tolerance="tolerance"
          :label="shown ? pitchClassName(shown.sung) : ''"
          :tone="meterClass"
          aria-live="polite"
        />
        <div class="hold" aria-hidden="true"><span :style="{ width: `${hold * 100}%` }" /></div>
      </template>
    </div>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { mic, stop } from 'ionicons/icons'
import GameShell from '@/components/GameShell.vue'
import TunerGauge from '@/components/TunerGauge.vue'
import { ADVANCE_DELAY, useQuiz } from '@/composables/useQuiz'
import { useRecording } from '@/composables/useRecording'
import { pitchClassName } from '@/music/notes'
import { createQuestion, judge, LEVELS, parseSettings, type Question, type Verdict } from '@/games/singTheNote'

const settings = parseSettings(useRoute().query)
const tolerance = LEVELS[settings.level].tolerance

let previous: Question | undefined
const quiz = useQuiz<Question>({
  total: settings.questions,
  createQuestion: () => (previous = createQuestion(settings.level, previous)),
  // Rien à écouter : la question s'affiche et le décompte des points démarre aussitôt.
  play: () => Promise.resolve(0),
})

/** La note retenue, après la réponse. */
const result = shallowRef<Verdict | null>(null)
const { recording, live: livePitch, hold, micError, toggle } = useRecording(quiz, onNote)
/** Dernière mesure du micro, jugée en direct pour l'aiguille. */
const live = computed(() => (livePitch.value ? judge(livePitch.value.frequency, quiz.question.value, settings.level) : null))

const shown = computed(() => (quiz.feedback.value ? result.value : recording.value ? live.value : null))
const meterClass = computed<'' | 'near' | 'ok' | 'ko'>(() => {
  if (!shown.value) return ''
  if (quiz.feedback.value) return quiz.feedback.value.correct ? 'ok' : 'ko'
  return Math.abs(shown.value.cents) <= tolerance ? 'near' : ''
})
const hint = computed(() => {
  if (quiz.feedback.value) return ' '
  if (recording.value) return 'Chante et tiens la note… (score en pause)'
  return 'Appuie pour chanter'
})

function onNote(frequency: number) {
  const q = quiz.question.value
  const verdict = judge(frequency, q, settings.level)
  result.value = verdict
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
</script>

<style scoped>
.record {
  width: 140px;
  height: 140px;
  font-size: 64px;
  display: grid;
  place-items: center;
}
.record:active {
  transform: scale(0.95);
}
.record:disabled {
  opacity: 0.5;
}
.hint {
  color: var(--ion-color-medium);
  margin: 12px 0 28px;
}
.mic {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
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
