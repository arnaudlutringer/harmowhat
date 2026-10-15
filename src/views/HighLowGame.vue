<template>
  <game-shell
    title="Grave ou aigu ?"
    prompt="Plus grave ou plus aigu que le La3 du diapason ?"
    :quiz="quiz"
    :board="{ game: 'grave-ou-aigu', level: SINGLE_LEVEL, questions: quiz.total }"
  >
    <div class="choices">
      <ion-button size="large" :disabled="!quiz.canAnswer.value" @click="choose('grave')">GRAVE</ion-button>
      <ion-button size="large" :disabled="!quiz.canAnswer.value" @click="choose('aigu')">AIGU</ion-button>
    </div>
  </game-shell>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue'
import GameShell from '@/components/GameShell.vue'
import { useQuiz } from '@/composables/useQuiz'
import { playPiano } from '@/audio/engine'
import { A440, noteName } from '@/music/notes'
import { currentInstrument, randomInstrumentNote } from '@/audio/instruments'
import { SINGLE_LEVEL } from '@/games/highScores'

// La référence est le La3 du diapason ; on ne tire jamais le La3 lui-même.
const quiz = useQuiz({ createQuestion: () => randomInstrumentNote(currentInstrument(), [A440]), play: (note) => playPiano(note) })

function choose(guess: 'grave' | 'aigu') {
  const note = quiz.question.value
  const truth = note < A440 ? 'grave' : 'aigu'
  quiz.answer(guess === truth, `C'était un ${noteName(note)}, plus ${truth} que le La3.`)
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
