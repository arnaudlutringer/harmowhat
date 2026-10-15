<template>
  <div class="result hw-square">
    <div class="emoji" aria-hidden="true">{{ copy.emoji }}</div>
    <h1>{{ summary.points }} <small>pts</small></h1>
    <p class="answers">{{ summary.correct }} / {{ total }} bonne{{ summary.correct > 1 ? 's' : '' }} réponse{{ summary.correct > 1 ? 's' : '' }}</p>

    <ol class="notes" aria-label="Détail des réponses">
      <li
        v-for="(r, i) in results"
        :key="i"
        :class="r.correct ? 'ok' : 'ko'"
        :title="`Question ${i + 1} : ${r.correct ? `juste, ${r.points} pts` : 'fausse'}`"
      >
        <ion-icon :icon="musicalNote" :aria-label="`Question ${i + 1} ${r.correct ? 'juste' : 'fausse'}`" />
      </li>
    </ol>

    <p>{{ copy.message }}</p>
    <ion-button expand="block" @click="restart">Rejouer</ion-button>
    <ion-button v-if="settingsHref" expand="block" fill="outline" :router-link="settingsHref" router-direction="back">
      Changer les réglages
    </ion-button>
    <ion-button expand="block" fill="outline" router-link="/home" router-direction="back">Autres jeux</ion-button>

    <button class="elise" :class="{ 'is-playing': elise.playing.value }" @click="toggleElise">
      <ion-icon :icon="elise.playing.value ? stop : musicalNotes" aria-hidden="true" />
      <span>
        <strong>{{ ending.title }}</strong>
        <small>{{ ending.composer }} · {{ wrongPercent }} % de notes faussées, comme tes erreurs</small>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { musicalNote, musicalNotes, stop } from 'ionicons/icons'
import { playSequence, stopAll, tierForScore } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'
import { summarize, type QuestionResult } from '@/games/scoring'
import { detune } from '@/music/furElise'
import { endingFor } from '@/music/endings'
import { selectedInstrument } from '@/audio/instruments'

const props = defineProps<{ results: QuestionResult[]; total: number; settingsHref?: string }>()
const emit = defineEmits<{ restart: [] }>()

const summary = computed(() => summarize(props.results))
const tier = computed(() => tierForScore(summary.value.correct, props.total))
const copy = computed(
  () =>
    ({
      great: { emoji: '🏆', message: 'Bravo, quelle oreille !' },
      good: { emoji: '🎶', message: 'Joli score, encore un petit effort.' },
      poor: { emoji: '🎧', message: "L'oreille, ça s'entraîne. On réessaie ?" },
    })[tier.value],
)

// Musique de fin (« Le Printemps » au violon, « La Lettre à Élise » sinon), avec autant de % de notes faussées d'un demi-ton
// que de % de mauvaises réponses. Tirées une fois pour cet écran.
const wrongRatio = props.total ? (props.total - summary.value.correct) / props.total : 0
const wrongPercent = Math.round(wrongRatio * 100)
const ending = endingFor(selectedInstrument.value)
const music = detune(ending.notes, wrongRatio)

const elise = usePlaying()

function playElise() {
  elise.track(playSequence(music, ending.unit).then((p) => p.duration)).catch(() => {})
}

// Un appui arrête le morceau, un autre le relance.
function toggleElise() {
  if (elise.playing.value) stopAll()
  else playElise()
}

function restart() {
  stopAll()
  emit('restart')
}

onMounted(playElise)
onBeforeUnmount(stopAll)
</script>

<style scoped>
.result {
  text-align: center;
  max-width: 360px;
  margin: 6vh auto 24px;
}
.emoji {
  font-size: 64px;
}
h1 {
  font-size: 48px;
  margin: 8px 0 0;
}
h1 small {
  font-size: 20px;
  color: var(--ion-color-medium);
}
.answers {
  font-size: 18px;
  margin: 4px 0 16px;
}
.notes {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  font-size: 26px;
}
.notes li {
  display: grid;
}
.notes .ok {
  color: var(--ion-color-success);
}
.notes .ko {
  color: var(--ion-color-danger);
}
p {
  margin-bottom: 24px;
}
.elise {
  margin-top: 24px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: none;
  background: var(--hw-button);
  color: var(--hw-button-text);
  text-align: left;
  cursor: pointer;
}
.elise.is-playing {
  animation-name: elise-pulse;
}
@keyframes elise-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--ion-color-secondary-rgb), 0.5);
  }
  100% {
    box-shadow: 0 0 0 10px rgba(var(--ion-color-secondary-rgb), 0);
  }
}
.elise ion-icon {
  font-size: 30px;
  flex: none;
}
.elise span {
  display: flex;
  flex-direction: column;
}
.elise small {
  opacity: 0.8;
}
</style>
