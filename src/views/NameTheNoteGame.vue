<template>
  <game-shell
    title="Quelle est la note ?"
    :prompt="`Quelle note as-tu entendue ? (niveau ${LEVELS[settings.level].label.toLowerCase()})`"
    :quiz="quiz"
    :board="{ game: 'quelle-note', level: settings.level, questions: settings.questions }"
    settings-href="/games/quelle-note"
    :no-tuning-fork="settings.level === 'expert'"
  >
    <div class="choices">
      <ion-button
        v-for="choice in quiz.question.value.choices"
        :key="choice"
        size="large"
        :color="colorFor(choice)"
        :disabled="!quiz.canAnswer.value && !quiz.feedback.value"
        @click="choose(choice)"
      >
        {{ choice }}
      </ion-button>
    </div>
  </game-shell>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { IonButton } from '@ionic/vue'
import GameShell from '@/components/GameShell.vue'
import { useQuiz } from '@/composables/useQuiz'
import { playPiano } from '@/audio/engine'
import { createQuestion, LEVELS, parseSettings } from '@/games/nameTheNote'

const settings = parseSettings(useRoute().query)

const quiz = useQuiz({
  total: settings.questions,
  createQuestion: () => createQuestion(settings.level),
  play: (q) => playPiano(q.midi),
})

function choose(choice: string) {
  if (!quiz.canAnswer.value) return
  const q = quiz.question.value
  q.picked = choice
  quiz.answer(choice === q.answer, `C'était un ${q.fullName}.`)
}

// Après la réponse : la bonne note en vert, le mauvais choix en rouge.
function colorFor(choice: string) {
  const q = quiz.question.value
  if (!quiz.feedback.value) return undefined
  if (choice === q.answer) return 'success'
  if (choice === q.picked) return 'danger'
  return 'medium'
}
</script>

<style scoped>
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.choices ion-button {
  height: 64px;
  font-size: 20px;
  text-transform: none;
}
</style>
