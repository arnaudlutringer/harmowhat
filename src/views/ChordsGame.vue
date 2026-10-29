<template>
  <game-shell
    title="Les accords"
    prompt="Quelles sont ces 3 notes ?"
    :quiz="quiz"
    :board="{ game: 'accords', level: settings.level, questions: settings.questions }"
    settings-href="/games/accords"
    swipe-to-next
  >
    <template #player>
      <div class="player">
        <flip-player :quiz="quiz" what="l'accord">
          <chord-staff :notes="q.notes.map((m) => q.spelled[m])" :label="`Accord ${chordName}`" />
        </flip-player>
      </div>
    </template>

    <div class="choices">
      <div v-for="midi in q.choices" :key="midi" class="choice" :class="stateFor(midi)">
        <button
          class="pick"
          :aria-pressed="selected.includes(midi)"
          :disabled="!quiz.canAnswer.value"
          @click="toggle(midi)"
        >
          {{ name(midi) }}
        </button>
      </div>
    </div>

    <ion-button
      v-if="!revealed"
      expand="block"
      size="large"
      class="validate"
      :disabled="selected.length !== CHORD_SIZE || !quiz.canAnswer.value"
      @click="validate"
    >
      Valider ({{ selected.length }}/{{ CHORD_SIZE }})
    </ion-button>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton } from '@ionic/vue'
import GameShell from '@/components/GameShell.vue'
import ChordStaff from '@/components/ChordStaff.vue'
import FlipPlayer from '@/components/FlipPlayer.vue'
import { useQuiz } from '@/composables/useQuiz'
import { playChord, playPiano } from '@/audio/engine'
import { spelledName } from '@/music/spelling'
import { CHORD_SIZE, createChordQuestion, isCorrect, parseSettings } from '@/games/chords'

const settings = parseSettings(useRoute().query)

// Pas de passage automatique : le joueur glisse vers la gauche quand il a fini de regarder la portée.
/** Durée de l'accord joué. */
const CHORD_MS = 2500

const quiz = useQuiz({
  total: settings.questions,
  createQuestion: () => createChordQuestion(settings.level),
  play: (q) => playChord(q.notes, { duration: CHORD_MS / 1000 }),
  // Le décompte des points démarre à la moitié de l'accord joué.
  countdownStart: () => CHORD_MS / 2,
  // On peut répondre dès 0,5 s de son.
  answersOpen: () => 500,
  advanceDelay: null,
})
const q = computed(() => quiz.question.value)
const selected = ref<number[]>([])
const revealed = computed(() => quiz.feedback.value !== null)
const name = (midi: number) => spelledName(q.value.spelled[midi])
const chordName = computed(() => q.value.notes.map(name).join(', '))

watch(q, () => (selected.value = []))

// Choisir une note la fait entendre ; la retirer ne joue rien.
function toggle(midi: number) {
  const i = selected.value.indexOf(midi)
  if (i >= 0) selected.value.splice(i, 1)
  else if (selected.value.length < CHORD_SIZE) {
    selected.value.push(midi)
    void playPiano(midi, { duration: 1.5 })
  }
}

function validate() {
  const ok = isCorrect(selected.value, q.value.notes)
  quiz.answer(ok, ok ? 'Bien entendu !' : `C'était ${chordName.value}.`)
  void quiz.listen()
}

// Après validation : bonnes notes en vert, erreurs en rouge, notes oubliées entourées.
function stateFor(midi: number) {
  const isSelected = selected.value.includes(midi)
  if (!revealed.value) return { selected: isSelected }
  const inChord = q.value.notes.includes(midi)
  return { right: inChord && isSelected, wrong: !inChord && isSelected, missed: inChord && !isSelected }
}
</script>

<style scoped>
/* Écran plus compact que les autres jeux : 8 notes et le bouton Valider doivent tenir sans défilement. */
.player {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.player :deep(.card) {
  height: 136px;
}
.player :deep(.front) {
  width: 120px;
  height: 120px;
  font-size: 56px;
}
/* La portée se réduit à la hauteur de la carte (moins sa marge intérieure) ; VexFlow fixe sa taille en style. */
.player :deep(.back svg) {
  display: block;
  height: 128px !important;
  width: auto !important;
  margin: 0 auto;
}
.player :deep(.hint) {
  margin: 8px 0 14px;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.choice {
  display: flex;
  overflow: hidden;
  border: 2px solid var(--hw-button);
  background: var(--hw-button);
  box-shadow: 0 2px 0 rgba(108, 92, 231, 0.35), 0 4px 10px rgba(45, 48, 71, 0.08);
}
.choice button {
  border: none;
  font-size: 18px;
  cursor: pointer;
  background: transparent;
  color: var(--hw-button-text);
}
.pick {
  flex: 1;
  padding: 12px 8px;
  font-weight: 600;
}
.pick:disabled {
  cursor: default;
}
.choice.selected .pick {
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
}
.choice.right {
  border-color: var(--ion-color-success);
}
.choice.right .pick {
  background: var(--ion-color-success);
  color: var(--ion-color-success-contrast);
}
.choice.wrong {
  border-color: var(--ion-color-danger);
}
.choice.wrong .pick {
  background: var(--ion-color-danger);
  color: var(--ion-color-danger-contrast);
}
.choice.missed {
  border-color: var(--ion-color-success);
  border-style: dashed;
}
.choice.missed .pick {
  color: var(--ion-color-success);
}
.validate {
  margin-top: 14px;
}
</style>
