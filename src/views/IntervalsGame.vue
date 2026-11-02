<template>
  <game-shell
    title="Les harmonies"
    :prompt="`Quel est l'intervalle entre les deux notes ?`"
    :quiz="quiz"
    :board="{ game: 'harmonies', level: `${settings.level}-${settings.precision}`, questions: settings.questions }"
    settings-href="/games/harmonies"
    swipe-to-next
    no-tuning-fork
  >
    <template #player>
      <flip-player :quiz="quiz" what="les deux notes">
        <chord-staff :notes="q.notes" melodic :label="`${q.notes.map(spelledName).join(' puis ')}`" />
      </flip-player>
    </template>

    <div class="choices">
      <ion-button
        v-for="choice in q.choices"
        :key="choice.id"
        :color="colorFor(choice.id)"
        :disabled="!quiz.canAnswer.value && !quiz.feedback.value"
        @click="choose(choice.id)"
      >
        <span class="label">{{ choice.label }}</span>
        <ion-icon
          v-if="choice.direction"
          :class="['direction', choice.direction]"
          :icon="arrowForward"
          :aria-label="choice.direction === 'up' ? 'ascendant' : 'descendant'"
        />
      </ion-button>
    </div>
  </game-shell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton, IonIcon } from '@ionic/vue'
import { arrowForward } from 'ionicons/icons'
import GameShell from '@/components/GameShell.vue'
import { trophyEvent } from '@/games/trophies'
import ChordStaff from '@/components/ChordStaff.vue'
import FlipPlayer from '@/components/FlipPlayer.vue'
import { useQuiz } from '@/composables/useQuiz'
import { playSequence } from '@/audio/engine'
import { spelledName } from '@/music/spelling'
import { createIntervalQuestion, LEVELS, parseSettings, type IntervalQuestion } from '@/games/intervals'
import { currentInstrument, randomInstrument, type Instrument } from '@/audio/instruments'

const settings = parseSettings(useRoute().query)

/** Les deux notes l'une après l'autre (0,9 s chacune). */
// Impossible : notes très brèves, jouées par un instrument tiré au hasard à chaque question.
const flash = LEVELS[settings.level].flash
let instrument: Instrument = currentInstrument()

function playInterval(q: IntervalQuestion) {
  const [a, b] = q.notes
  return playSequence(
    flash
      ? [
          { midi: a.midi, at: 0, len: 0.35 },
          { midi: b.midi, at: 0.4, len: 0.35 },
        ]
      : [
          { midi: a.midi, at: 0, len: 1 },
          { midi: b.midi, at: 1, len: 1.6 },
        ],
    0.9,
    0.7,
    instrument,
  ).then((p) => p.duration)
}

// Pas de passage automatique : le joueur glisse vers la gauche quand il a fini de regarder la portée.
const quiz = useQuiz({
  total: settings.questions,
  createQuestion: () => {
    if (flash) instrument = randomInstrument()
    return createIntervalQuestion(settings, instrument)
  },
  play: playInterval,
  advanceDelay: null,
})
const q = computed(() => quiz.question.value)

function choose(id: string) {
  if (!quiz.canAnswer.value) return
  q.value.picked = id
  const [a, b] = q.value.notes.map(spelledName)
  const { label, direction } = q.value.answer
  const sens = direction ? (direction === 'up' ? ' ascendante' : ' descendante') : ''
  if (id === q.value.answer.id) trophyEvent({ type: 'interval', semitones: q.value.interval.semitones })
  quiz.answer(id === q.value.answer.id, `${label}${sens} : ${a} puis ${b}.`)
}

// Après la réponse : la bonne en vert, le mauvais choix en rouge.
function colorFor(id: string) {
  if (!quiz.feedback.value) return undefined
  if (id === q.value.answer.id) return 'success'
  if (id === q.value.picked) return 'danger'
  return 'medium'
}
</script>

<style scoped>
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.choices ion-button {
  min-height: 56px;
  margin: 0;
  font-size: 15px;
  text-transform: none;
  white-space: normal;
}
.choices ion-button::part(native) {
  padding: 6px 8px;
}
.direction {
  font-size: 20px;
  margin-left: 4px;
  flex: none;
}
/* Flèche droite inclinée : vers le haut/droite en montant, vers le bas/droite en descendant. */
.direction.up {
  transform: rotate(-45deg);
}
.direction.down {
  transform: rotate(45deg);
}
</style>
