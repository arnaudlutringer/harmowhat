<template>
  <game-shell
    title="Chante l'harmonie"
    :prompt="`Chante ${q.label} !`"
    :quiz="quiz"
    :board="{ game: 'chante-harmonie', level: settings.level, questions: settings.questions }"
    settings-href="/games/chante-harmonie"
    swipe-to-next
    no-tuning-fork
  >
    <template #player>
      <!-- Après la réponse : la portée remplace les boutons, avec la note jouée, puis sur la même pulsation la note attendue (vert) et la note chantée (rouge). -->
      <div v-if="quiz.feedback.value && result" class="staff">
        <chord-staff
          :notes="staffNotes"
          melodic
          :correct="[1]"
          :wrong="result.correct ? [] : [2]"
          :together="[2]"
          :label="staffLabel"
        />
      </div>
      <template v-else>
        <div class="buttons">
          <div class="button">
            <button class="play" :class="{ 'is-playing': quiz.playing.value }" aria-label="Réécouter la note" :disabled="recording" @click="replay">
              <ion-icon :icon="quiz.playing.value ? volumeHigh : play" />
            </button>
            <span>Son</span>
          </div>
          <div class="button">
            <button
              class="play"
              :class="{ 'is-playing': recording }"
              :aria-label="recording ? 'Arrêter l’enregistrement' : 'Chanter : démarrer l’enregistrement'"
              :disabled="!quiz.canAnswer.value"
              @click="toggle"
            >
              <ion-icon :icon="recording ? stop : mic" />
            </button>
            <span>Micro</span>
          </div>
        </div>
        <p class="hint">{{ hint }}</p>
        <p v-if="micError" class="error">{{ micError }}</p>
        <!-- Accordeur : la note chantée et sa justesse propre (écart au demi-ton le plus proche), sans dévoiler la note attendue. -->
        <tuner-gauge
          v-else
          :cents="sung?.cents ?? null"
          :tolerance="SELF_TUNING"
          :label="sung?.name ?? ''"
          :tone="sung && Math.abs(sung.cents) <= SELF_TUNING ? 'near' : ''"
        />
        <div class="hold" aria-hidden="true"><span :style="{ width: `${hold * 100}%` }" /></div>
      </template>
    </template>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { mic, play, stop, volumeHigh } from 'ionicons/icons'
import GameShell from '@/components/GameShell.vue'
import { trophyEvent } from '@/games/trophies'
import ChordStaff from '@/components/ChordStaff.vue'
import TunerGauge from '@/components/TunerGauge.vue'
import { useQuiz } from '@/composables/useQuiz'
import { useRecording } from '@/composables/useRecording'
import { playPiano } from '@/audio/engine'
import { midiOf } from '@/audio/pitch'
import { pitchClassName } from '@/music/notes'
import { spelledName, spelledPitchName } from '@/music/spelling'
import { createQuestion, judge, parseSettings, type Question, type Verdict } from '@/games/singHarmony'

const settings = parseSettings(useRoute().query)

/** Durée de la note jouée. */
const NOTE_MS = 2500

const quiz = useQuiz<Question>({
  total: settings.questions,
  createQuestion: () => createQuestion(settings.level),
  play: (question) => playPiano(question.base.midi, { duration: NOTE_MS / 1000 }),
  // Le décompte des points démarre aux 80 % de la note jouée.
  countdownStart: () => NOTE_MS * 0.8,
  // Pas de passage automatique : le joueur glisse vers la gauche quand il a fini de regarder la portée.
  advanceDelay: null,
})
const q = computed(() => quiz.question.value)

/** La note retenue, après la réponse. */
const result = shallowRef<Verdict | null>(null)
const { recording, live, hold, micError, toggle: toggleRecording } = useRecording(quiz, onNote)

// Réécoute : le score se met en pause pendant la première moitié de la note.
let replayTimer: ReturnType<typeof setTimeout> | undefined
function replay() {
  clearTimeout(replayTimer)
  void quiz.listen()
  quiz.pause()
  replayTimer = setTimeout(quiz.resume, NOTE_MS / 2)
}

// Le micro garde la pause à son compte : elle ne doit pas s'arrêter à la fin de la réécoute.
function toggle() {
  clearTimeout(replayTimer)
  toggleRecording()
}
onBeforeUnmount(() => clearTimeout(replayTimer))

/** Zone verte de l'accordeur : une note chantée juste, à 15 cents près. */
const SELF_TUNING = 15
/** Note chantée en direct, arrondie au demi-ton, et son écart à ce demi-ton. */
const sung = computed(() => {
  if (!recording.value || !live.value) return null
  const midi = midiOf(live.value.frequency)
  const nearest = Math.round(midi)
  return { name: pitchClassName(nearest), cents: Math.round((midi - nearest) * 100) }
})

const hint = computed(() => {
  if (recording.value) return 'Chante et tiens la note… (score en pause)'
  if (quiz.playing.value) return 'Écoute…'
  return 'Appuie sur Micro pour chanter'
})

const staffNotes = computed(() => (result.value ? [q.value.base, q.value.target, ...(result.value.correct ? [] : [result.value.sung])] : []))
const staffLabel = computed(() => staffNotes.value.map(spelledName).join(', '))

function onNote(frequency: number) {
  const verdict = judge(frequency, q.value)
  result.value = verdict
  if (verdict.correct) trophyEvent({ type: 'harmony-sung', semitones: q.value.interval.semitones })
  const { base, target, label } = q.value
  const expected = `${label} de ${spelledPitchName(base)}, c'est ${spelledPitchName(target)}`
  quiz.answer(
    verdict.correct,
    verdict.correct
      ? `${expected[0].toUpperCase()}${expected.slice(1)} : bien chanté !`
      : `Tu as chanté un ${spelledPitchName(verdict.sung)} ; ${expected}.`,
  )
}
</script>

<style scoped>
.buttons {
  display: flex;
  gap: 32px;
  justify-content: center;
}
.button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--ion-color-medium);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}
.play {
  width: 110px;
  height: 110px;
  font-size: 52px;
  display: grid;
  place-items: center;
}
.play:active {
  transform: scale(0.95);
}
.play:disabled {
  opacity: 0.5;
}
.hint {
  color: var(--ion-color-medium);
  margin: 12px 0 8px;
  text-align: center;
}
.error {
  text-align: center;
  color: var(--ion-color-danger);
}
.staff {
  width: 100%;
  max-width: 320px;
}
/* Note tenue : la barre se remplit pendant le chant ; pleine, la note est jugée. */
.hold {
  width: 120px;
  height: 4px;
  margin: 0 auto 20px;
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
</style>
