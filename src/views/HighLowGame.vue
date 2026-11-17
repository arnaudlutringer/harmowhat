<template>
  <game-shell
    title="Grave ou aigu ?"
    :prompt="level.randomReference ? 'La deuxième note est-elle plus grave ou plus aiguë que la première ?' : 'Plus grave ou plus aigu que le diapason ?'"
    :quiz="quiz"
    :board="{ game: 'grave-ou-aigu', level: settings.level, questions: settings.questions }"
    settings-href="/games/grave-ou-aigu"
    :advance-bar="ADVANCE_DELAY"
    :no-tuning-fork="level.randomReference"
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
import { createHighLowQuestion, LEVELS, parseSettings, type HighLowQuestion } from '@/games/highLow'
import { currentInstrument, randomInstrument, type Instrument } from '@/audio/instruments'

const settings = parseSettings(useRoute().query)
const level = LEVELS[settings.level]

/** Expert et Impossible : la note de départ, puis la note à comparer, à cet intervalle (secondes). */
const GAP = 1.1
let instruments: [Instrument, Instrument] = [currentInstrument(), currentInstrument()]

// Débutant et normal : la référence est le La3 du diapason, seule la note est jouée.
// Expert et Impossible : une note de départ au hasard, puis la note à comparer.
// Après la réponse, une barre se remplit en 1,5 s, puis vient la question suivante.
const quiz = useQuiz<HighLowQuestion>({
  total: settings.questions,
  createQuestion: () => {
    if (!level.twoInstruments) {
      instruments = [currentInstrument(), currentInstrument()]
      return createHighLowQuestion(settings.level)
    }
    // Impossible : deux instruments différents, tirés au hasard, pour la note de départ et la note à comparer.
    const first = randomInstrument(A440)
    const question = createHighLowQuestion(settings.level, first)
    let second = randomInstrument(question.note)
    for (let i = 0; i < 10 && second.id === first.id; i++) second = randomInstrument(question.note)
    instruments = [first, second]
    return question
  },
  play: async (q) => {
    if (!level.randomReference) return playPiano(q.note, { instrument: instruments[0] })
    const started = performance.now()
    await playPiano(q.reference, { instrument: instruments[0], duration: GAP })
    const when = Math.max(0, GAP - (performance.now() - started) / 1000)
    const duration = await playPiano(q.note, { instrument: instruments[1], when })
    return GAP + duration
  },
  // Expert et Impossible : le décompte démarre avec la deuxième note.
  countdownStart: level.randomReference ? () => GAP * 1000 : undefined,
  answersOpen: level.randomReference ? () => GAP * 1000 : undefined,
})

function choose(guess: 'grave' | 'aigu') {
  const { reference, note } = quiz.question.value
  const truth = note < reference ? 'grave' : 'aigu'
  const ref = reference === A440 && !level.randomReference ? 'le La3' : `le ${noteName(reference)}`
  quiz.answer(
    guess === truth,
    Number.isInteger(note) ? `C'était un ${noteName(note)}, plus ${truth} que ${ref}.` : `C'était un quart de ton plus ${truth} que ${ref}.`,
  )
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
