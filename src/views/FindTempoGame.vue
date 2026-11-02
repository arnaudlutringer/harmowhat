<template>
  <game-shell
    title="Trouve le tempo"
    prompt="Quel est le tempo de cette mélodie ?"
    :quiz="quiz"
    :board="{ game: 'trouve-tempo', level: settings.level, questions: settings.questions }"
    settings-href="/games/trouve-tempo"
    swipe-to-next
    no-tuning-fork
    :compact="!cfg.choices"
  >
    <!-- Au curseur, un bouton de lecture plus petit, à côté de sa consigne : le métronome et Valider tiennent à l'écran. -->
    <template v-if="!cfg.choices" #player>
      <div class="mini-player">
        <button class="play" :class="{ 'is-playing': quiz.playing.value }" aria-label="Écouter la mélodie" @click="quiz.listen()">
          <ion-icon :icon="quiz.playing.value ? volumeHigh : play" />
        </button>
        <span>{{ quiz.playing.value ? 'Écoute…' : !quiz.hasListened.value ? 'Lecture…' : revealed ? 'Réécouter' : quiz.replayCosts.value ? `Réécouter (−${quiz.replayPenalty} pts)` : ' ' }}</span>
      </div>
    </template>
    <!-- Débutant : 4 tempos proposés. -->
    <div v-if="cfg.choices" class="choices">
      <ion-button
        v-for="t in q.choices"
        :key="t"
        :color="colorFor(t)"
        :disabled="!quiz.canAnswer.value && !revealed"
        @click="choose(t)"
      >
        ♩ = {{ t }}
      </ion-button>
    </div>

    <!-- Normal et expert : le curseur du métronome, puis Valider. -->
    <template v-else>
      <metronome-slider v-model="guess" :min="cfg.low" :max="cfg.high" :disabled="revealed" :target="revealed ? q.tempo : undefined" />
    </template>
    <!-- Au curseur : Valider fixé en bas de l'écran, avec le message de la réponse. -->
    <template v-if="!cfg.choices" #bottom>
      <ion-button v-if="!revealed" expand="block" size="large" class="validate" :disabled="!quiz.canAnswer.value" @click="choose(guess)">
        Valider
      </ion-button>
    </template>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton, IonIcon } from '@ionic/vue'
import { play, volumeHigh } from 'ionicons/icons'
import GameShell from '@/components/GameShell.vue'
import MetronomeSlider from '@/components/MetronomeSlider.vue'
import { useQuiz } from '@/composables/useQuiz'
import { BEATS } from '@/games/rhythm'
import { COUNT_IN, playRhythm } from '@/games/rhythmAudio'
import { createFindQuestion, FIND_LEVELS, isTempoClose, parseFindSettings, type FindQuestion } from '@/games/tempo'
import { trophyEvent } from '@/games/trophies'

const settings = parseFindSettings(useRoute().query)
const cfg = FIND_LEVELS[settings.level]
const beatMs = (q: FindQuestion) => (60 / q.tempo) * 1000

const quiz = useQuiz({
  total: settings.questions,
  createQuestion: () => createFindQuestion(settings.level),
  play: (q) => playRhythm(q.cells, q.tempo, { pitches: q.pitches }).then((p) => p.duration),
  // On peut répondre dès la mélodie ; les points baissent à partir de sa fin. Réécouter met le score en pause.
  answersOpen: (q) => COUNT_IN * beatMs(q),
  countdownStart: (q) => (COUNT_IN + BEATS) * beatMs(q),
  pauseOnReplay: true,
  advanceDelay: null,
})
const q = computed(() => quiz.question.value)
const revealed = computed(() => quiz.feedback.value !== null)
const guess = ref(120)
const picked = ref<number | null>(null)

watch(q, () => {
  picked.value = null
  guess.value = 120
})

function choose(answer: number) {
  if (!quiz.canAnswer.value) return
  picked.value = answer
  const { tempo } = q.value
  const ok = cfg.choices ? answer === tempo : isTempoClose(settings.level, answer, tempo)
  // Écart compté au curseur seulement (en débutant, la réponse est forcément pile).
  if (ok) trophyEvent({ type: 'tempo-found', error: cfg.choices ? -1 : Math.abs(answer - tempo) })
  const yours = cfg.choices ? '' : `, tu as dit ${answer}`
  quiz.answer(ok, ok ? `Bien vu : ♩ = ${tempo}${yours}.` : `C'était ♩ = ${tempo}${yours}.`)
}

// Après la réponse : le bon tempo en vert, le mauvais choix en rouge.
function colorFor(t: number) {
  if (!revealed.value) return undefined
  if (t === q.value.tempo) return 'success'
  if (t === picked.value) return 'danger'
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
  font-weight: 700;
}
.validate {
  margin-top: 10px;
}
.mini-player {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.mini-player .play {
  width: 64px;
  height: 64px;
  font-size: 30px;
  display: grid;
  place-items: center;
}
.mini-player span {
  color: var(--ion-color-medium);
}
</style>
