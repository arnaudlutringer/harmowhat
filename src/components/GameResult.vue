<template>
  <div class="result hw-square">
    <div class="emoji" aria-hidden="true">{{ emoji }}</div>
    <h1>{{ summary.points }} <small>pts</small></h1>
    <p class="answers">{{ summary.correct }} / {{ total }} bonne{{ summary.correct > 1 ? 's' : '' }} réponse{{ summary.correct > 1 ? 's' : '' }}</p>

    <!-- Le score entre dans au moins un classement (monde, pays, téléphone) : on propose de l'enregistrer dans les trois. -->
    <form v-if="record" class="record" @submit.prevent="saveRecord">
      <strong>🏅 Tu entres dans les meilleurs scores !</strong>
      <p class="tops">
        <span v-if="tops.monde">🌍 Monde</span>
        <span v-if="tops.pays">{{ country?.flag }} {{ country?.name }}</span>
        <span v-if="tops.appareil">📱 Téléphone</span>
      </p>
      <ion-input
        v-model="playerName"
        :maxlength="MAX_NAME_LENGTH"
        label="Ton nom"
        label-placement="stacked"
        fill="outline"
        placeholder="10 caractères au plus"
        autocapitalize="words"
        @ion-input="nameError = false"
      />
      <p v-if="nameError" class="error">Indique ton nom pour enregistrer ton score.</p>
      <!-- Le pays vient de l'onglet Joueur des paramètres. -->
      <p v-if="worldEnabled" class="country">{{ country?.flag }} {{ country?.name }} <small>(modifiable dans Paramètres › Mon compte)</small></p>
      <ion-button type="submit" expand="block" :disabled="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</ion-button>
    </form>

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

    <button class="elise" :class="{ 'is-playing': elise.playing.value }" @click="toggleElise">
      <ion-icon :icon="elise.playing.value ? stop : musicalNotes" aria-hidden="true" />
      <span>
        <strong>{{ ending.title }}</strong>
        <small v-if="ending.recording">{{ ending.composer }}</small>
        <small v-else>
          {{ ending.composer }} ·
          {{ wrongPercent ? `${wrongPercent} % d'erreurs : le musicien a un peu trop fêté ça` : 'joué sans une fausse note' }}
        </small>
      </span>
    </button>

    <ion-button expand="block" @click="restart">Rejouer</ion-button>
    <ion-button v-if="settingsHref" expand="block" fill="outline" :router-link="settingsHref" router-direction="back">
      Changer les réglages
    </ion-button>
    <ion-button expand="block" fill="outline" router-link="/home" router-direction="back">Autres jeux</ion-button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { IonButton, IonIcon, IonInput, useIonRouter } from '@ionic/vue'
import { musicalNote, musicalNotes, stop } from 'ionicons/icons'
import { playRecording, playSequence, stopAll, tierForScore } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'
import { summarize, type QuestionResult } from '@/games/scoring'
import { drunk } from '@/music/drunk'
import { ENDING_SECONDS, endingFor } from '@/music/endings'
import { selectedInstrument } from '@/audio/instruments'
import {
  cleanName, getScores, lastPlayerName, MAX_NAME_LENGTH, qualifies, saveScore, scoresHref, type Board,
} from '@/games/highScores'
import { cachedBoard, fetchBoard, submitScore, worldEnabled } from '@/games/worldScores'
import { countryByCode } from '@/player/countries'
import { profile } from '@/player/profile'

const props = defineProps<{ results: QuestionResult[]; total: number; board: Board; settingsHref?: string }>()
const emit = defineEmits<{ restart: [] }>()

const summary = computed(() => summarize(props.results))

// Meilleurs scores : si la partie entre dans le top 10 du monde, du pays du joueur ou du téléphone, le joueur
// peut l'enregistrer (nom pré-rempli avec celui de Mon compte). Le score est alors enregistré partout :
// sur le téléphone, et dans la base mondiale, qui alimente les classements du monde et des pays.
const router = useIonRouter()
const tops = reactive({ monde: false, pays: false, appareil: qualifies(getScores(props.board), summary.value.points) })
const saved = ref(false)
const record = computed(() => !saved.value && (tops.monde || tops.pays || tops.appareil))
const playerName = ref(lastPlayerName())
const nameError = ref(false)
const saving = ref(false)
const country = computed(() => countryByCode(profile.value.country))

onMounted(() => {
  const points = summary.value.points
  if (!worldEnabled || points <= 0) return
  const code = profile.value.country
  // D'abord le cache chargé au lancement (réponse immédiate, même hors connexion), puis la base à jour.
  const world = cachedBoard(props.board)
  const local = cachedBoard(props.board, code)
  if (world) tops.monde = qualifies(world, points)
  if (local) tops.pays = qualifies(local, points)
  fetchBoard(props.board)
    .then((rows) => (tops.monde = qualifies(rows, points)))
    .catch(() => {})
  fetchBoard(props.board, code)
    .then((rows) => (tops.pays = qualifies(rows, points)))
    .catch(() => {})
})

async function saveRecord() {
  const name = cleanName(playerName.value)
  if (!name) {
    nameError.value = true
    return
  }
  if (saving.value) return
  saving.value = true
  const { points, correct } = summary.value
  const entry = { name, points, correct, date: new Date().toISOString(), playerId: profile.value.id }
  // Téléphone (son top 10), puis base mondiale (monde et pays) : on attend un peu l'envoi pour que le score
  // y figure déjà ; sans connexion, il partira plus tard.
  const rank = saveScore(props.board, entry)
  await Promise.race([submitScore(props.board, entry), new Promise((r) => setTimeout(r, 3000))])
  saved.value = true
  saving.value = false
  stopAll()
  // On ouvre le plus beau des classements où le score entre.
  const vue = tops.monde ? 'monde' : tops.pays ? 'pays' : 'appareil'
  router.push(`${scoresHref(props.board, rank, { name, points })}&vue=${worldEnabled ? vue : 'appareil'}`)
}
const tier = computed(() => tierForScore(summary.value.correct, props.total))
const emoji = computed(() => ({ great: '🏆', good: '🎶', poor: '🎧' })[tier.value])

// Musique de fin, selon l'instrument (voir music/endings.ts), d'autant plus mal jouée (musicien éméché)
// que le joueur a fait d'erreurs (voir music/drunk.ts). Tirée une fois pour cet écran.
const wrongRatio = props.total ? (props.total - summary.value.correct) / props.total : 0
const wrongPercent = Math.round(wrongRatio * 100)
// Un enregistrement (KenZ au piano) est joué tel quel, sans fausses notes.
const ending = endingFor(selectedInstrument.value)
const music = drunk(ending.notes, wrongRatio)

const elise = usePlaying()

function playElise() {
  const sound = ending.recording
    ? playRecording(ending.recording, ENDING_SECONDS)
    : playSequence(music, ending.unit).then((p) => p.duration)
  elise.track(sound).catch(() => {})
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
.record {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 0 24px;
  padding: 16px;
  background: var(--hw-button);
  box-shadow: 0 2px 0 rgba(108, 92, 231, 0.35), 0 4px 10px rgba(45, 48, 71, 0.08);
  text-align: left;
}
.record strong {
  color: var(--ion-color-primary);
}
.record .tops {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
}
.record .tops span {
  padding: 2px 10px;
  border-radius: 12px;
  background: var(--hw-button-active);
  color: var(--ion-color-primary);
  font-size: 14px;
  font-weight: 600;
}
.record .country {
  margin: 0;
  font-size: 15px;
}
.record .country small {
  color: var(--ion-color-medium);
}
.record .error {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-danger);
}
.elise {
  margin: 0 0 24px;
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
