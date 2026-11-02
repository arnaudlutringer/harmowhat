<template>
  <game-shell
    title="Grave ou aigu ?"
    prompt="Plus grave ou plus aigu que le diapason ?"
    :quiz="quiz"
    :board="{ game: 'grave-ou-aigu', level: settings.level, questions: settings.questions }"
    settings-href="/games/grave-ou-aigu"
    :advance-bar="ADVANCE_DELAY"
  >
    <div class="choices">
      <ion-button size="large" :disabled="!quiz.canAnswer.value" @click="choose('grave')">GRAVE</ion-button>
      <ion-button size="large" :disabled="!quiz.canAnswer.value" @click="choose('aigu')">AIGU</ion-button>
    </div>
  </game-shell>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { IonButton } from '@ionic/vue'
import GameShell from '@/components/GameShell.vue'
import { ADVANCE_DELAY, useQuiz } from '@/composables/useQuiz'
import { playPiano } from '@/audio/engine'
import { A440, noteName } from '@/music/notes'
import { createHighLowQuestion, LEVELS, parseSettings } from '@/games/highLow'
import { randomInstrument, type Instrument } from '@/audio/instruments'

const settings = parseSettings(useRoute().query)
let instrument: Instrument | undefined

// La référence est le La3 du diapason ; la note jouée en est plus ou moins éloignée selon le niveau.
// Après la réponse, une barre se remplit en 1,5 s, puis vient la question suivante.
const quiz = useQuiz({
  total: settings.questions,
  createQuestion: () => {
    // Impossible : un instrument au hasard pour chaque question.
    instrument = LEVELS[settings.level].quarterTone ? randomInstrument(A440) : undefined
    return createHighLowQuestion(settings.level, instrument)
  },
  play: (note) => playPiano(note, { instrument }),
})

function choose(guess: 'grave' | 'aigu') {
  const note = quiz.question.value
  const truth = note < A440 ? 'grave' : 'aigu'
  const what = Number.isInteger(note) ? `un ${noteName(note)}` : `un La3 un quart de ton plus ${truth}`
  quiz.answer(guess === truth, Number.isInteger(note) ? `C'était ${what}, plus ${truth} que le La3.` : `C'était ${what}.`)
}
</script>

<style scoped>
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.choices ion-button {
  height: 72px;
  font-weight: 700;
}
</style>
