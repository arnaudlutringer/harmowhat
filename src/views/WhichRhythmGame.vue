<template>
  <game-shell
    title="Quel rythme ?"
    prompt="Quel est ce rythme ? Choisis les 3 temps, dans l'ordre."
    :quiz="quiz"
    :board="{ game: 'quel-rythme', level: settings.level, questions: settings.questions }"
    settings-href="/games/quel-rythme"
    swipe-to-next
    no-tuning-fork
  >
    <template #player>
      <div class="player">
        <!-- Le bouton de lecture se retourne à la réponse : le vrai rythme, temps justes en vert, erreurs en rouge. -->
        <flip-player :quiz="quiz" what="le rythme">
          <rhythm-staff :cells="q.cells" :correct="rightBeats" :wrong="wrongBeats" :label="rhythmLabel" />
        </flip-player>
      </div>
    </template>

    <!-- Les trois temps choisis ; toucher un temps le retire. -->
    <div class="slots">
      <button
        v-for="i in BEATS"
        :key="i"
        class="slot"
        :class="slotState(i - 1)"
        :disabled="!quiz.canAnswer.value || !selected[i - 1]"
        :aria-label="selected[i - 1] ? `Temps ${i} : ${CELLS[selected[i - 1]].label} (toucher pour retirer)` : `Temps ${i} : vide`"
        @click="removeAt(i - 1)"
      >
        <span class="beat">{{ i }}</span>
        <rhythm-staff v-if="selected[i - 1]" :cells="[selected[i - 1]]" compact />
      </button>
    </div>

    <div class="choices">
      <button
        v-for="id in choices"
        :key="id"
        class="choice"
        :disabled="!quiz.canAnswer.value || selected.length >= BEATS"
        :aria-label="CELLS[id].label"
        @click="pick(id)"
      >
        <rhythm-staff :cells="[id]" compact />
      </button>
    </div>

    <ion-button
      v-if="!revealed"
      expand="block"
      size="large"
      class="validate"
      :disabled="selected.length !== BEATS || !quiz.canAnswer.value"
      @click="validate"
    >
      Valider ({{ selected.length }}/{{ BEATS }})
    </ion-button>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton } from '@ionic/vue'
import GameShell from '@/components/GameShell.vue'
import FlipPlayer from '@/components/FlipPlayer.vue'
import RhythmStaff from '@/components/RhythmStaff.vue'
import { useQuiz } from '@/composables/useQuiz'
import { BEATS, CELLS, createRhythmQuestion, LEVELS, parseSettings, shuffledChoices, type CellId } from '@/games/rhythm'
import { COUNT_IN, playRhythm } from '@/games/rhythmAudio'

const settings = parseSettings(useRoute().query)
const tempo = LEVELS[settings.level].tempo
const beatMs = (60 / tempo) * 1000

const quiz = useQuiz({
  total: settings.questions,
  createQuestion: () => createRhythmQuestion(settings.level),
  play: (q) => playRhythm(q.cells, tempo).then((p) => p.duration),
  // On peut répondre dès le début de la mesure ; les points baissent à partir de sa fin.
  answersOpen: () => COUNT_IN * beatMs,
  countdownStart: () => (COUNT_IN + BEATS) * beatMs,
  // Pas de passage automatique : le joueur glisse vers la gauche quand il a fini de regarder la portée.
  advanceDelay: null,
})
const q = computed(() => quiz.question.value)
const choices = ref<CellId[]>(shuffledChoices(q.value))
const selected = ref<CellId[]>([])
const revealed = computed(() => quiz.feedback.value !== null)
const rhythmLabel = computed(() => q.value.cells.map((c) => CELLS[c].label).join(', '))

watch(q, (question) => {
  selected.value = []
  choices.value = shuffledChoices(question)
})

function pick(id: CellId) {
  if (selected.value.length < BEATS) selected.value.push(id)
}

function removeAt(i: number) {
  if (!revealed.value) selected.value.splice(i, 1)
}

const rightBeats = computed(() => (revealed.value ? q.value.cells.flatMap((c, i) => (selected.value[i] === c ? [i] : [])) : []))
const wrongBeats = computed(() => (revealed.value ? q.value.cells.flatMap((c, i) => (selected.value[i] !== c ? [i] : [])) : []))

function slotState(i: number) {
  if (!revealed.value) return { filled: !!selected.value[i] }
  return { right: selected.value[i] === q.value.cells[i], wrong: selected.value[i] !== q.value.cells[i] }
}

function validate() {
  const ok = q.value.cells.every((c, i) => selected.value[i] === c)
  quiz.answer(ok, ok ? 'Bien entendu !' : `C'était : ${rhythmLabel.value.toLowerCase()}.`)
  void quiz.listen()
}
</script>

<style scoped>
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
.player :deep(.hint) {
  margin: 8px 0 12px;
}
.slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.slot {
  position: relative;
  height: 64px;
  border: 2px dashed rgba(var(--ion-color-primary-rgb), 0.4);
  background: transparent;
  color: var(--ion-text-color);
  padding: 4px;
  cursor: pointer;
}
.slot.filled {
  border-style: solid;
  background: var(--hw-button);
}
.slot.right {
  border: 2px solid var(--ion-color-success);
  background: var(--hw-button);
}
.slot.wrong {
  border: 2px solid var(--ion-color-danger);
  background: var(--hw-button);
}
.beat {
  position: absolute;
  top: 2px;
  left: 6px;
  font-size: 12px;
  color: var(--ion-color-medium);
}
.choices {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.choice {
  height: 64px;
  padding: 4px 6px;
  border: none;
  background: var(--hw-button);
  color: var(--hw-button-text);
  box-shadow: 0 2px 0 rgba(108, 92, 231, 0.35), 0 4px 10px rgba(45, 48, 71, 0.08);
  cursor: pointer;
}
.choice:disabled {
  opacity: 0.5;
  cursor: default;
}
.slot :deep(.staff),
.choice :deep(.staff) {
  height: 100%;
}
.slot :deep(svg),
.choice :deep(svg) {
  height: 100% !important;
  width: 100% !important;
}
.validate {
  margin-top: 14px;
}
</style>
