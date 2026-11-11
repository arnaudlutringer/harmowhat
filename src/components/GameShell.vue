<template>
  <ion-page>
    <!-- Pas de bouton Retour dans les jeux : le bouton retour du téléphone propose de quitter la partie.
         Pendant les questions, le score, le diapason et le total restent fixés en haut. -->
    <ion-header v-if="playing" class="ion-no-border game-header">
        <div class="meta">
          <div class="points" :class="{ frozen: quiz.feedback.value }" aria-label="Points de la question">
            <strong>{{ livePoints ?? quiz.points.value }} <span class="pts">pts</span></strong>
          </div>
          <!-- Le diapason n'est disponible que pendant les questions (et jamais en mode expert). -->
          <tuning-fork-button v-if="!noTuningFork" class="fork" @played="quiz.penalizeTuningFork()" />
          <div class="progress">
            <!-- Essai : une seule question, sans total ; « Essai » en grand à la place. -->
            <span v-if="quiz.trial" class="trial">Essai</span>
            <span v-if="!quiz.trial && progressLabel">{{ progressLabel }}</span>
            <span v-else-if="!quiz.trial && endless">Palier {{ quiz.number.value }}</span>
            <span v-else-if="!quiz.trial">Question {{ quiz.number.value }} / {{ quiz.total }}</span>
            <span v-if="!quiz.trial && !progressLabel" class="total" :class="{ bump: landed }">Total : {{ shownTotal }} <span class="pts">pts</span></span>
          </div>
          <!-- Points gagnés à la question : « +350pts » en biais, qui s'envole des points de la question vers le total (1,5 s). -->
          <strong v-if="gain" :key="gain.id" class="gain" aria-live="polite">+{{ gain.points }}<span class="pts">pts</span></strong>
        </div>
    </ion-header>
    <ion-content class="ion-padding" :class="{ 'with-result-actions': quiz.finished.value }">
      <game-result
        v-if="quiz.finished.value"
        :results="quiz.results.value"
        :total="endless ? quiz.results.value.length : quiz.total"
        :answers-label="answersLabel"
        :score-ratio="scoreRatio"
        :note-marks="noteMarks"
        :music-label="musicLabel"
        :board="board"
        :settings-href="settingsHref"
        :fork-available="!noTuningFork"
        :fork-used="quiz.forkUsed.value"
        @restart="quiz.restart"
      />
      <!-- Sous le bilan, ce qu'un jeu veut y ajouter (le compte rendu de « Lecture continue »). -->
      <slot v-if="quiz.finished.value" name="result" />

      <div v-else-if="quiz.countdown.value !== null" class="countdown" aria-live="assertive">
        <p v-if="quiz.trial" class="trial countdown-trial">Essai</p>
        <p>Prêt ?</p>
        <span :key="quiz.countdown.value" class="count">{{ quiz.countdown.value }}</span>
      </div>

      <div
        v-else
        class="game hw-square"
        :class="{ compact }"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="swipeStart = null"
      >
        <p class="prompt"><slot name="prompt">{{ prompt }}</slot></p>

        <slot name="player">
          <button class="play" :class="{ 'is-playing': quiz.playing.value }" aria-label="Écouter la note" @click="quiz.listen()">
            <ion-icon :icon="quiz.playing.value ? volumeHigh : play" />
          </button>
          <p class="hint">{{ quiz.playing.value ? 'Écoute…' : !quiz.hasListened.value ? 'Lecture…' : quiz.feedback.value ? 'Réécouter' : quiz.replayCosts.value ? `Réécouter (−${quiz.replayPenalty} pts)` : ' ' }}</p>
        </slot>

        <div class="answers">
          <slot />
        </div>

        <game-feedback v-if="!pinned" reserve :quiz="quiz" :endless="endless" :advance-bar="advanceBar" :swipe-to-next="swipeToNext" @understood="backToSettings" />
      </div>
    </ion-content>
    <!-- Jeux avec un bouton Valider : lui et le message de la réponse restent fixés en bas de l'écran. -->
    <ion-footer v-if="playing && pinned" class="ion-no-border game-footer" @pointerdown="onPointerDown" @pointerup="onPointerUp">
      <div class="bottom">
        <slot name="bottom" />
        <game-feedback :quiz="quiz" :endless="endless" :advance-bar="advanceBar" :swipe-to-next="swipeToNext" @understood="backToSettings" />
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  alertController, IonContent, IonFooter, IonHeader, IonIcon, IonPage, onIonViewWillLeave, useBackButton, useIonRouter,
} from '@ionic/vue'
import { useRoute } from 'vue-router'
import { play, volumeHigh } from 'ionicons/icons'
import TuningForkButton from './TuningForkButton.vue'
import GameResult from './GameResult.vue'
import GameFeedback from './GameFeedback.vue'
import type { useQuiz } from '@/composables/useQuiz'
import type { Board } from '@/games/highScores'
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { preloadPiano, stopAll } from '@/audio/engine'
import { track } from '@/games/tracking'

const props = defineProps<{
  title: string
  prompt: string
  quiz: ReturnType<typeof useQuiz<unknown>>
  /** Classement des meilleurs scores de la partie (jeu, niveau, nombre de questions). */
  board: Board
  /** Écran de réglages du jeu, s'il en a un. */
  settingsHref?: string
  /** Après une réponse, passer à la question suivante en glissant le doigt de droite à gauche. */
  swipeToNext?: boolean
  /** Pas de diapason pendant les questions (mode expert, jeu des intervalles). */
  noTuningFork?: boolean
  /** Délai du passage automatique à la question suivante (ms) : une barre se remplit pendant ce temps. */
  advanceBar?: number
  /** Partie sans nombre de questions (« Garde le tempo ») : « Palier n », et le bilan compte les paliers. */
  endless?: boolean
  /** Bilan propre au jeu, à la place de « n / total bonnes réponses ». */
  answersLabel?: string
  /** Réussite de la partie, de 0 à 1, si elle ne se compte pas en bonnes réponses (« Garde le tempo » : points / 10 000). */
  scoreRatio?: number
  /** Écran serré (« Trouve le tempo » au curseur) : moins d'espace autour de la consigne et du message. */
  compact?: boolean
  /** Points de la partie en cours, à la place de ceux de la question (lecture en défilement : une partie d'un seul tenant). */
  livePoints?: number
  /** Avancée de la partie, à la place de « Question n / total » et du total (« 12 notes lues »). */
  progressLabel?: string
  /** Écran de fin : une note par note lue (vrai) ou manquée (faux), à la place d'une par question. */
  noteMarks?: boolean[]
  /** Écran de fin : texte sous le titre de la musique, à la place du pourcentage d'erreurs. */
  musicLabel?: string
}>()

/** Pendant les questions (ni compte à rebours ni écran de fin) : en-tête et pied fixes. */
const playing = computed(() => !props.quiz.finished.value && props.quiz.countdown.value === null)
/** Le jeu met son bouton Valider dans le pied : le message de la réponse l'y rejoint. */
const slots = useSlots()
const pinned = computed(() => !!slots.bottom)

// À chaque réponse qui rapporte des points (sauf la première, où le total ne fait que démarrer),
// le gain s'envole vers le total en 1,5 s ; le total « saute » et n'augmente qu'au moment où il l'atteint.
const GAIN_DURATION = 1500
const GAIN_LANDING = 1250
const gain = ref<{ id: number; points: number } | null>(null)
const landed = ref(false)
/** Total affiché : il suit le vrai total, mais attend l'arrivée du gain quand celui-ci s'envole. */
const shownTotal = ref(props.quiz.totalPoints.value)
let gainTimers: ReturnType<typeof setTimeout>[] = []
const clearGainTimers = () => gainTimers.forEach(clearTimeout)
watch(
  () => props.quiz.results.value.length,
  (n, before) => {
    const last = props.quiz.results.value[n - 1]
    if (n <= before || n === 1 || !last || last.points <= 0) {
      // Pas d'envol (nouvelle partie, première question, mauvaise réponse) : le total est à jour tout de suite.
      shownTotal.value = props.quiz.totalPoints.value
      return
    }
    clearGainTimers()
    gain.value = { id: n, points: last.points }
    landed.value = false
    gainTimers = [
      setTimeout(() => {
        landed.value = true
        shownTotal.value = props.quiz.totalPoints.value
      }, GAIN_LANDING),
      setTimeout(() => {
        gain.value = null
        landed.value = false
      }, GAIN_DURATION),
    ]
  },
)
onBeforeUnmount(clearGainTimers)
// Envol interrompu (ex. nouvelle partie) : le total affiché ne doit pas rester en retard.
watch(
  () => props.quiz.finished.value,
  () => (shownTotal.value = props.quiz.totalPoints.value),
)

// Glissement horizontal vers la gauche : au moins 60 px, plus horizontal que vertical.
const swipeStart = ref<{ x: number; y: number } | null>(null)

function onPointerDown(e: PointerEvent) {
  swipeStart.value = { x: e.clientX, y: e.clientY }
}

function onPointerUp(e: PointerEvent) {
  const start = swipeStart.value
  swipeStart.value = null
  if (!start || !props.swipeToNext || props.quiz.trial || !props.quiz.feedback.value) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) props.quiz.next()
}

// Mesure d'utilisation : une partie lancée à l'ouverture du jeu, puis à chaque nouvelle partie (« Rejouer »).
const gameInfo = () => ({ game: props.board.game, level: props.board.level, details: { questions: props.board.questions, essai: !!props.quiz.trial } })
onMounted(() => track('partie_lancee', gameInfo()))
watch(
  () => props.quiz.finished.value,
  (finished, before) => before && !finished && track('partie_lancee', gameInfo()),
)

// Charge les sons du piano dès l'ouverture du jeu pour qu'ils soient prêts au premier clic.
onMounted(() => void preloadPiano().catch(() => {}))
// On quitte l'écran : plus aucun son.
onIonViewWillLeave(stopAll)

// Bouton retour du téléphone pendant une partie : la partie se met en pause et on demande avant de quitter ;
// si le joueur confirme, il revient aux réglages du jeu (ou à l'accueil pour un jeu sans réglages).
// Hors partie (écran de fin), il revient simplement à l'écran précédent.
const router = useIonRouter()
// Les événements de vue d'Ionic (onIonViewDidEnter…) ne parviennent qu'au composant de la page, pas à GameShell :
// le jeu est à l'écran quand la route courante est celle sur laquelle il a été ouvert.
const route = useRoute()
const ownPath = route.path
let confirming = false

async function confirmQuit() {
  confirming = true
  props.quiz.pause()
  const alert = await alertController.create({
    header: 'Quitter la partie ?',
    message: 'Ta partie en cours sera perdue.',
    buttons: [
      { text: 'Continuer', role: 'cancel' },
      { text: 'Quitter', role: 'confirm' },
    ],
  })
  await alert.present()
  const { role } = await alert.onDidDismiss()
  confirming = false
  if (role !== 'confirm') return props.quiz.resume()
  track('partie_abandonnee', { ...gameInfo(), details: { ...gameInfo().details, question: props.quiz.number.value } })
  backToSettings()
}

/** Retour aux réglages du jeu (ou à l'accueil pour un jeu sans réglages), qui reproposent les derniers choisis. */
function backToSettings() {
  stopAll()
  const target = props.settingsHref ?? '/home'
  // On vient en général des réglages : on y revient dans l'historique plutôt que d'en empiler une copie.
  if (window.history.state?.back === target) router.back()
  else router.navigate(target, 'back', 'replace')
}

useBackButton(20, (processNextHandler) => {
  if (route.path !== ownPath) return processNextHandler()
  // Écran de résultat : retour direct aux réglages du jeu (sans passer par l'accueil).
  if (props.quiz.finished.value) return backToSettings()
  if (!confirming) void confirmQuit()
})
</script>

<style scoped>
/* Écran de résultat : de la place sous le contenu pour les boutons figés en bas. */
ion-content.with-result-actions {
  --padding-bottom: calc(150px + var(--ion-safe-area-bottom, 0px));
}
/* Compte à rebours avant la première question : un grand chiffre qui apparaît à chaque seconde,
   centré sur toute la hauteur de l'écran (moins les marges du contenu). */
.countdown {
  min-height: calc(100vh - 2 * var(--ion-padding, 16px) - var(--ion-safe-area-top, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.countdown p {
  margin: 0 0 8px;
  font-size: 22px;
  color: var(--ion-color-medium);
}
.count {
  font-size: 160px;
  font-weight: 800;
  line-height: 1;
  color: var(--ion-color-primary);
  animation: pop 1s ease-out;
}
@keyframes pop {
  0% {
    transform: scale(1.6);
    opacity: 0;
  }
  25% {
    transform: scale(1);
    opacity: 1;
  }
}
/* La question remplit la hauteur entre l'en-tête et le pied : ses éléments se répartissent, sans vide en bas. */
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  max-width: 420px;
  min-height: 100%;
  margin: 0 auto;
}
.game-header,
.game-footer {
  background: var(--ion-background-color);
}
.game-header .meta {
  max-width: 420px;
  margin: 0 auto;
  padding: calc(10px + var(--ion-safe-area-top, 0px)) 16px 4px;
}
/* Pied fixe : toujours la même hauteur (Valider avant la réponse, le message après), la question ne bouge pas. */
.bottom {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 150px;
  max-width: 420px;
  margin: 0 auto;
  padding: 8px 16px calc(12px + var(--ion-safe-area-bottom, 0px));
}
.bottom :deep(.feedback) {
  margin-top: 8px;
}
.meta {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: var(--ion-color-medium);
  font-size: 14px;
}
.points,
.progress {
  flex: 1;
}
/* Diapason : bouton rond (les autres boutons du jeu sont carrés). */
.fork {
  margin: -4px 0 0;
  width: 48px;
  height: 48px;
  --border-radius: 50%;
  --padding-start: 0;
  --padding-end: 0;
  --color: var(--ion-color-primary);
}
.points {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--ion-color-primary);
}
.points strong {
  font-size: 28px;
  font-variant-numeric: tabular-nums;
}
.points.frozen {
  color: var(--ion-color-medium);
}
/* Le total grossit un instant quand le gain l'atteint. */
.total {
  display: inline-block;
  transform-origin: right center;
}
/* Mode essai : « Essai » en rouge à la place du total. */
/* Même taille et même hauteur de ligne que les points de la question : sur la même ligne qu'eux. */
.trial {
  color: var(--ion-color-danger);
  font-size: 28px;
  font-weight: 700;
  line-height: normal;
}
.countdown .countdown-trial {
  color: var(--ion-color-danger);
  font-size: 26px;
}
.total.bump {
  animation: bump 0.25s ease-out;
}
@keyframes bump {
  50% {
    transform: scale(1.25);
    color: var(--ion-color-primary);
    font-weight: 700;
  }
}
.gain {
  position: absolute;
  left: 0;
  top: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--ion-color-primary);
  white-space: nowrap;
  pointer-events: none;
  /* Contour couleur du fond : le gain reste lisible par-dessus le texte qu'il survole. */
  text-shadow:
    0 0 3px var(--ion-background-color),
    0 0 3px var(--ion-background-color),
    0 0 6px var(--ion-background-color);
  animation: gain 1.5s ease-in-out forwards;
}
/*
 * Apparaît en biais au-dessus des points de la question, puis s'envole en arc vers le total
 * (à droite, sur la deuxième ligne), rapetisse en s'y posant et s'efface.
 */
@keyframes gain {
  0% {
    left: 0;
    top: 6px;
    opacity: 0;
    transform: translateX(0) rotate(-12deg) scale(0.6);
  }
  12% {
    opacity: 1;
    transform: translateX(0) rotate(-12deg) scale(1.15);
  }
  25% {
    left: 0;
    top: 0;
    transform: translateX(0) rotate(-12deg) scale(1);
  }
  55% {
    left: 50%;
    top: -16px;
    transform: translateX(-50%) rotate(-12deg) scale(1);
  }
  83% {
    left: 100%;
    top: 16px;
    opacity: 1;
    transform: translateX(-100%) rotate(-12deg) scale(0.6);
  }
  100% {
    left: 100%;
    top: 16px;
    opacity: 0;
    transform: translateX(-100%) rotate(-12deg) scale(0.4);
  }
}
.progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.prompt {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0;
  text-align: center;
}
.play {
  width: 140px;
  height: 140px;
  font-size: 64px;
  display: grid;
  place-items: center;
}
.play:active {
  transform: scale(0.95);
}
.hint {
  color: var(--ion-color-medium);
  margin: 12px 0 28px;
}
.answers {
  width: 100%;
}
.game {
  touch-action: pan-y;
}
/* Écran serré : tout doit tenir sans défiler. */
.compact .prompt {
  margin: 10px 0 8px;
}
/* Petit écran (Samsung A10) : la question et son résultat tiennent sans défilement. */
@media (max-height: 740px) {
  .prompt {
    margin: 4px 0 6px;
    font-size: 18px;
  }
  .play {
    width: 92px;
    height: 92px;
    font-size: 42px;
  }
  .hint {
    margin: 4px 0 6px;
  }
  .bottom {
    min-height: 104px;
    padding-top: 4px;
    padding-bottom: calc(8px + var(--ion-safe-area-bottom, 0px));
  }
}
</style>
