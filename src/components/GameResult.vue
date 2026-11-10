<template>
  <div class="result hw-square">
    <!-- Mes trophées, en haut à droite : les trophées gagnés s'y envolent. -->
    <ion-button class="trophies" fill="clear" router-link="/trophees" data-trophy-target aria-label="Mes trophées" title="Mes trophées">
      <ion-icon slot="icon-only" :icon="medalOutline" />
    </ion-button>
    <trophy-unlocked :queue="unlocked" />
    <img class="emoji" :src="tierImage" alt="" />
    <h1>{{ summary.points }} <span class="pts">pts</span></h1>
    <p v-if="answersLabel" class="answers">{{ answersLabel }}</p>
    <p v-else class="answers">{{ summary.correct }} / {{ total }} bonne{{ summary.correct > 1 ? 's' : '' }} réponse{{ summary.correct > 1 ? 's' : '' }}</p>
    <!-- Sous le score, sur une ligne : boutons secondaires, comme « Autre jeu ». -->
    <div class="score-actions">
      <button type="button" :disabled="sharing" @click="share">
        <ion-icon :icon="shareSocialOutline" aria-hidden="true" />
        Partager mon score
      </button>
      <button v-if="autoSaved" type="button" @click="openScores(autoSaved.rank, autoSaved.name)">
        <ion-icon :icon="podiumOutline" aria-hidden="true" />
        Voir les meilleurs scores
      </button>
    </div>

    <!-- Médaille d'or gagnée à l'instant : le diamant de ce jeu devient accessible. -->
    <div v-if="diamondUnlocked" class="diamond" role="status">
      <span class="gem" aria-hidden="true"><medal-dot kind="goat" :size="34" label="" /></span>
      <span>
        <strong>Diamant débloqué !</strong>
        <small>Pour le gagner, {{ goatGoal(board.game) }}.</small>
      </span>
    </div>

    <!-- Le score entre dans au moins un classement (monde, pays, téléphone) : on propose de l'enregistrer dans les trois. -->
    <!-- Sauvegarde automatique (Mon compte) : le score est déjà enregistré ; on montre sous quel nom, et le classement. -->
    <!-- Partie d'un match : publier son défi, ou le résultat contre celui qui l'a lancé. -->
    <match-result :board="board" :points="summary.points" :correct="summary.correct" />

    <div v-if="autoSaved" class="record auto">
      <strong>🏅 Tu entres dans les meilleurs scores !</strong>
      <p class="tops">
        <span v-if="tops.monde">🌍 Monde</span>
        <span v-if="tops.pays">{{ country?.flag }} {{ country?.name }}</span>
        <span v-if="tops.appareil">📱 Téléphone</span>
      </p>
      <p class="country">Enregistré au nom de <strong>{{ autoSaved.name }}</strong><template v-if="worldEnabled"> · {{ country?.flag }} {{ country?.name }}</template></p>
    </div>
    <form v-else-if="record" class="record" @submit.prevent="saveRecord">
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
        @ion-focus="typingName = true"
        @ion-blur="typingName = false"
      />
      <p v-if="nameError" class="error">Indique ton nom pour enregistrer ton score.</p>
      <!-- Le pays vient de l'onglet Joueur des paramètres. -->
      <p v-if="worldEnabled" class="country">{{ country?.flag }} {{ country?.name }} <small>(modifiable dans Paramètres › Mon compte)</small></p>
      <ion-button type="submit" expand="block" :disabled="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</ion-button>
    </form>

    <ol class="notes" aria-label="Détail des réponses">
      <!-- Jeu d'un seul tenant (« Lecture continue ») : une note par note lue, plutôt qu'une par question. -->
      <template v-if="noteMarks">
        <li v-for="(correct, i) in noteMarks" :key="i" :class="correct ? 'ok' : 'ko'" :title="`Note ${i + 1} : ${correct ? 'lue' : 'manquée'}`">
          <ion-icon :icon="musicalNote" :aria-label="`Note ${i + 1} ${correct ? 'lue' : 'manquée'}`" />
        </li>
      </template>
      <template v-else>
        <li
          v-for="(r, i) in results"
          :key="i"
          :class="r.correct ? 'ok' : 'ko'"
          :title="`Question ${i + 1} : ${r.correct ? `juste, ${r.points} pts` : 'fausse'}`"
        >
          <ion-icon :icon="musicalNote" :aria-label="`Question ${i + 1} ${r.correct ? 'juste' : 'fausse'}`" />
        </li>
      </template>
    </ol>

    <button class="elise" :class="{ 'is-playing': elise.playing.value }" @click="toggleElise">
      <ion-icon :icon="elise.playing.value ? stop : musicalNotes" aria-hidden="true" />
      <span>
        <strong>{{ ending.title }}</strong>
        <small v-if="ending.recording">{{ ending.composer }}</small>
        <small v-else-if="musicLabel">{{ ending.composer }} · {{ musicLabel }}</small>
        <small v-else>
          {{ ending.composer }} ·
          {{ wrongPercent ? `${wrongPercent} % d'erreurs : le musicien a un peu trop fêté ça` : 'joué sans une fausse note' }}
        </small>
      </span>
    </button>

    <!-- Figés en bas de l'écran, comme « C'est parti ! » dans les réglages (masqués pendant la saisie du nom : le clavier les remonterait). -->
    <div v-show="!typingName" class="result-actions">
      <div class="result-actions-inner">
        <button type="button" class="again" @click="restart">Rejouer</button>
        <div class="others">
          <button v-if="settingsHref" type="button" @click="leave(settingsHref)">Changer les réglages</button>
          <button type="button" @click="leave('/home')">Autre jeu</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { IonButton, IonIcon, IonInput, useIonRouter } from '@ionic/vue'
import { medalOutline, musicalNote, musicalNotes, podiumOutline, shareSocialOutline, stop } from 'ionicons/icons'
import { playRecording, playSequence, stopAll, tierForScore } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'
import { summarize, type QuestionResult } from '@/games/scoring'
import { drunk } from '@/music/drunk'
import { ENDING_SECONDS, endingFor } from '@/music/endings'
import { selectedInstrument } from '@/audio/instruments'
import {
  cleanName, GAMES, getScores, lastPlayerName, levelLabel, MAX_NAME_LENGTH, qualifies, saveScore, scoresHref, type Board,
} from '@/games/highScores'
import { cachedBoard, fetchBoard, submitScore, worldEnabled } from '@/games/worldScores'
import { countryByCode } from '@/player/countries'
import { profile } from '@/player/profile'
import { online } from '@/player/online'
import { earnedTrophies, evaluateGame, goatGoal, levelMedalWon, takePendingTrophies, type Tier, type Trophy } from '@/games/trophies'
import TrophyUnlocked from './TrophyUnlocked.vue'
import MedalDot from './MedalDot.vue'
import MatchResult from './MatchResult.vue'
import { shareImage } from '@/share/shareImage'
import { dayNumber, isTodaysChallenge } from '@/games/dailyChallenge'

const props = defineProps<{
  results: QuestionResult[]
  total: number
  board: Board
  settingsHref?: string
  /** Le diapason était proposé pendant les questions, et a servi (trophée « Sans filet »). */
  forkAvailable?: boolean
  forkUsed?: boolean
  /** Bilan propre au jeu, à la place de « n / total bonnes réponses ». */
  answersLabel?: string
  /** Réussite de 0 à 1, à la place de la part de bonnes réponses (image de fin et musique). */
  scoreRatio?: number
  /** Détail de la partie, à la place d'une note par question : vrai pour une note lue, faux pour une note manquée. */
  noteMarks?: boolean[]
  /** Texte sous le titre de la musique, à la place du pourcentage d'erreurs. */
  musicLabel?: string
}>()
const emit = defineEmits<{ restart: [] }>()

const summary = computed(() => summarize(props.results))

// Trophées : la partie est comptée une fois, à l'arrivée sur cet écran ; les nouveaux trophées s'annoncent un par un.
const unlocked = ref<{ trophy: Trophy; tier?: Tier }[]>([])
const diamondUnlocked = ref(false)
function countTrophies() {
  const game = props.board.game
  const hadGold = levelMedalWon(game, 'expert')
  evaluateGame({
    board: props.board,
    results: props.results,
    instrument: selectedInstrument.value,
    forkAvailable: !!props.forkAvailable,
    forkUsed: !!props.forkUsed,
    challengeDay: isTodaysChallenge(props.board) ? dayNumber() : undefined,
  })
  unlocked.value = takePendingTrophies()
  // Si le diamant est gagné dans la même partie que l'or, il n'y a plus rien à débloquer.
  diamondUnlocked.value = !hadGold && levelMedalWon(game, 'expert') && !earnedTrophies.value[`goat-${game}`]
}
onMounted(countTrophies)

// Meilleurs scores : si la partie entre dans le top 10 du monde, du pays du joueur ou du téléphone, le joueur
// peut l'enregistrer (nom pré-rempli avec celui de Mon compte). Le score est alors enregistré partout :
// sur le téléphone, et dans la base mondiale, qui alimente les classements du monde et des pays.
const router = useIonRouter()
const tops = reactive({ monde: false, pays: false, appareil: qualifies(getScores(props.board), summary.value.points) })
const saved = ref(false)
const record = computed(() => !saved.value && (tops.monde || tops.pays || tops.appareil))
const playerName = ref(lastPlayerName())
const nameError = ref(false)
const typingName = ref(false)
const saving = ref(false)
const country = computed(() => countryByCode(profile.value.country))

onMounted(() => {
  const points = summary.value.points
  if (!worldEnabled || points <= 0) return
  const code = profile.value.country
  // D'abord le cache chargé au lancement (réponse immédiate, même hors connexion), puis la base à jour.
  const world = cachedBoard(props.board)
  const local = cachedBoard(props.board, code)
  const update = (scope: 'monde' | 'pays', rows: { points: number }[]) => {
    tops[scope] = qualifies(rows as never, points)
  }
  if (world) update('monde', world)
  if (local) update('pays', local)
  const refresh = () => {
    fetchBoard(props.board)
      .then((rows) => update('monde', rows))
      .catch(() => {})
    fetchBoard(props.board, code)
      .then((rows) => update('pays', rows))
      .catch(() => {})
  }
  refresh()
  // Partie finie hors connexion : les classements monde et pays sont rechargés dès que la connexion revient.
  stopOnline = watch(online, (now) => now && refresh())
})
let stopOnline: (() => void) | undefined
onBeforeUnmount(() => stopOnline?.())

/** Enregistre le score sur le téléphone (son top 10) et l'envoie au classement mondial ; renvoie son rang sur le téléphone. */
function storeScore(name: string): { rank: number; sent: Promise<unknown> } {
  const { points, correct } = summary.value
  const entry = { name, points, correct, date: new Date().toISOString(), playerId: profile.value.id }
  return { rank: saveScore(props.board, entry), sent: submitScore(props.board, entry) }
}

/** Ouvre le plus beau des classements où le score entre. */
function openScores(rank: number, name: string) {
  stopAll()
  const vue = tops.monde ? 'monde' : tops.pays ? 'pays' : 'appareil'
  router.push(`${scoresHref(props.board, rank, { name, points: summary.value.points })}&vue=${worldEnabled ? vue : 'appareil'}`)
}

async function saveRecord() {
  const name = cleanName(playerName.value)
  if (!name) {
    nameError.value = true
    return
  }
  if (saving.value) return
  saving.value = true
  // Base mondiale (monde et pays) : on attend un peu l'envoi pour que le score y figure déjà ; sans connexion, il partira plus tard.
  const { rank, sent } = storeScore(name)
  await Promise.race([sent, new Promise((r) => setTimeout(r, 3000))])
  saved.value = true
  saving.value = false
  openScores(rank, name)
}

// Sauvegarde automatique (option de Mon compte, avec un nom) : dès que le score entre dans un classement,
// il est enregistré tout seul, une seule fois.
const autoSaved = ref<{ name: string; rank: number } | null>(null)
watch(
  record,
  (entersBoard) => {
    const name = cleanName(profile.value.name)
    if (!entersBoard || !profile.value.autoSave || !name || autoSaved.value) return
    const { rank, sent } = storeScore(name)
    sent.catch(() => {})
    saved.value = true
    autoSaved.value = { name, rank }
  },
  { immediate: true },
)
const success = props.scoreRatio !== undefined ? Math.min(1, Math.max(0, props.scoreRatio)) : undefined
const tier = computed(() => (success !== undefined ? tierForScore(success, 1) : tierForScore(summary.value.correct, props.total)))
// Image de fin de partie selon le résultat : oreille en or, en argent ou en fer (public/results/).
const tierImage = computed(() => `${import.meta.env.BASE_URL}results/${tier.value}.png`)

// Musique de fin, selon l'instrument (voir music/endings.ts), d'autant plus mal jouée (musicien éméché)
// que le joueur a fait d'erreurs (voir music/drunk.ts). Tirée une fois pour cet écran.
const wrongRatio = success !== undefined ? 1 - success : props.total ? (props.total - summary.value.correct) / props.total : 0
const wrongPercent = Math.round(wrongRatio * 100)
// Un enregistrement est joué tel quel, sans fausses notes.
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

// Partage : l'image du score (la place dans un classement se partage depuis l'écran des scores).
const sharing = ref(false)
async function share() {
  if (sharing.value) return
  sharing.value = true
  const { points, correct } = summary.value
  try {
    await shareImage({ kind: 'score', game: GAMES[props.board.game].title, level: levelLabel(props.board), points, correct, total: props.total, tierImage: tierImage.value })
  } catch {
    // Partage annulé ou impossible : rien à signaler.
  } finally {
    sharing.value = false
  }
}

function restart() {
  stopAll()
  emit('restart')
}

/** Quitte l'écran de fin : on revient dans l'historique si possible, sans empiler une copie d'un écran déjà ouvert (il ne s'afficherait pas). */
function leave(path: string) {
  stopAll()
  if (window.history.state?.back === path) router.back()
  else router.navigate(path, 'back', 'replace')
}

onMounted(playElise)
onBeforeUnmount(stopAll)
</script>

<style scoped>
.result {
  position: relative;
  text-align: center;
  max-width: 360px;
  margin: 0 auto 24px;
}
/* « Mes trophées » en haut à droite de l'écran (la popin des trophées gagnés s'envole vers lui). */
.trophies {
  position: fixed;
  top: calc(8px + var(--ion-safe-area-top, 0px));
  right: 8px;
  z-index: 5;
  --color: var(--ion-color-primary);
  font-size: 22px;
}
.emoji {
  display: block;
  width: 128px;
  height: 128px;
  margin: 0 auto;
}
h1 {
  font-size: 48px;
  margin: 8px 0 0;
}
h1 .pts {
  color: var(--ion-color-medium);
}
.answers {
  font-size: 18px;
  margin: 4px 0 4px;
}
/* Boutons secondaires : les mêmes que « Changer les réglages » et « Autre jeu ». */
.score-actions {
  display: flex;
  gap: 8px;
  margin: 8px 0 16px;
}
.score-actions button {
  flex: 1;
  min-width: 0;
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 8px;
  border: none;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  color: var(--ion-color-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.15;
  box-shadow: 0 4px 10px rgba(45, 48, 71, 0.1);
  cursor: pointer;
}
.score-actions ion-icon {
  flex: none;
  font-size: 20px;
}
.score-actions button:disabled {
  opacity: 0.5;
}
/* Le diamant débloqué : un encart sombre, le diamant qui apparaît en grossissant. */
.diamond {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 16px;
  padding: 12px 16px;
  border-radius: 18px;
  background: var(--hw-daily, #2d3047);
  color: #fff;
  text-align: left;
  box-shadow: 0 8px 20px rgba(45, 48, 71, 0.25);
}
.diamond .gem {
  flex: none;
  font-size: 40px;
  line-height: 1;
  animation: diamond-pop 0.7s ease-out both;
}
.diamond strong {
  display: block;
  font-size: 18px;
  color: #f2c94c;
}
.diamond small {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  line-height: 1.3;
}
@keyframes diamond-pop {
  0% {
    transform: scale(0.2) rotate(-25deg);
    opacity: 0;
  }
  70% {
    transform: scale(1.25) rotate(6deg);
    opacity: 1;
  }
  100% {
    transform: none;
  }
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
/* Les boutons du bas : mêmes styles que « C'est parti ! » et « Un essai » dans les réglages d'un jeu. */
.result-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  background: var(--ion-background-color);
}
.result-actions-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 480px;
  margin: 0 auto;
  padding: 10px 16px calc(12px + var(--ion-safe-area-bottom, 0px));
}
.result-actions button {
  border: none;
  font-family: inherit;
  cursor: pointer;
}
.again {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #7d6cf2, #4b3fd1);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 10px 22px rgba(76, 63, 209, 0.35);
}
.others {
  display: flex;
  gap: 8px;
}
.others button {
  flex: 1;
  min-height: 46px;
  padding: 6px;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  color: var(--ion-color-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.15;
  box-shadow: 0 4px 10px rgba(45, 48, 71, 0.1);
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
/* Score enregistré automatiquement : tout le bloc est centré. */
.record.auto {
  align-items: center;
  text-align: center;
}
.record.auto .tops {
  justify-content: center;
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
