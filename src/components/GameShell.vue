<template>
  <ion-page>
    <!-- Pas d'en-tête ni de bouton Retour dans les jeux : le bouton retour du téléphone propose de quitter la partie. -->
    <ion-content class="ion-padding">
      <game-result
        v-if="quiz.finished.value"
        :results="quiz.results.value"
        :total="quiz.total"
        :board="board"
        :settings-href="settingsHref"
        @restart="quiz.restart"
      />

      <div v-else-if="quiz.countdown.value !== null" class="countdown" aria-live="assertive">
        <p>Prêt ?</p>
        <span :key="quiz.countdown.value" class="count">{{ quiz.countdown.value }}</span>
      </div>

      <div
        v-else
        class="game hw-square"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="swipeStart = null"
      >
        <div class="meta">
          <div class="points" :class="{ frozen: quiz.feedback.value }" aria-label="Points de la question">
            <strong>{{ quiz.points.value }}</strong>
            <span>pts</span>
          </div>
          <!-- Le diapason n'est disponible que pendant les questions (et jamais en mode expert). -->
          <tuning-fork-button v-if="!noTuningFork" class="fork" @played="quiz.penalizeTuningFork()" />
          <div class="progress">
            <span>Question {{ quiz.number.value }} / {{ quiz.total }}</span>
            <span>Total : {{ quiz.totalPoints.value }} pts</span>
          </div>
        </div>

        <p class="prompt">{{ prompt }}</p>

        <slot name="player">
          <button class="play" :class="{ 'is-playing': quiz.playing.value }" aria-label="Écouter la note" @click="quiz.listen()">
            <ion-icon :icon="quiz.playing.value ? volumeHigh : play" />
          </button>
          <p class="hint">{{ quiz.playing.value ? 'Écoute…' : !quiz.hasListened.value ? 'Lecture…' : quiz.feedback.value ? 'Réécouter' : 'Réécouter (−100 pts)' }}</p>
        </slot>

        <div class="answers">
          <slot />
        </div>

        <div class="feedback" :class="quiz.feedback.value?.correct ? 'ok' : 'ko'" aria-live="polite">
          <template v-if="quiz.feedback.value">
            <strong>{{ quiz.feedback.value.correct ? 'Bonne réponse !' : 'Mauvaise réponse' }}</strong>
            <span>{{ quiz.feedback.value.message }}</span>
            <button v-if="swipeToNext" class="next-hint" @click="quiz.next()">
              Glisse vers la gauche pour {{ quiz.number.value < quiz.total ? 'la question suivante' : 'voir ton score' }} ›
            </button>
          </template>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  alertController, IonContent, IonIcon, IonPage, onIonViewDidEnter,
  onIonViewWillLeave, useBackButton, useIonRouter,
} from '@ionic/vue'
import { play, volumeHigh } from 'ionicons/icons'
import TuningForkButton from './TuningForkButton.vue'
import GameResult from './GameResult.vue'
import type { useQuiz } from '@/composables/useQuiz'
import type { Board } from '@/games/highScores'
import { onMounted, ref } from 'vue'
import { preloadPiano, stopAll } from '@/audio/engine'

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
}>()

// Glissement horizontal vers la gauche : au moins 60 px, plus horizontal que vertical.
const swipeStart = ref<{ x: number; y: number } | null>(null)

function onPointerDown(e: PointerEvent) {
  swipeStart.value = { x: e.clientX, y: e.clientY }
}

function onPointerUp(e: PointerEvent) {
  const start = swipeStart.value
  swipeStart.value = null
  if (!start || !props.swipeToNext || !props.quiz.feedback.value) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) props.quiz.next()
}

// Charge les sons du piano dès l'ouverture du jeu pour qu'ils soient prêts au premier clic.
onMounted(() => void preloadPiano().catch(() => {}))
// On quitte l'écran : plus aucun son.
onIonViewWillLeave(stopAll)

// Bouton retour du téléphone pendant une partie : on demande avant de quitter, et on revient à l'accueil.
// Hors partie (écran de fin), il revient simplement à l'écran précédent.
const router = useIonRouter()
let visible = false
onIonViewDidEnter(() => (visible = true))
onIonViewWillLeave(() => (visible = false))

async function confirmQuit() {
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
  if (role === 'confirm') {
    stopAll()
    router.navigate('/home', 'back', 'push')
  }
}

useBackButton(20, (processNextHandler) => {
  if (!visible || props.quiz.finished.value) return processNextHandler()
  void confirmQuit()
})
</script>

<style scoped>
/* Compte à rebours avant la première question : un grand chiffre qui apparaît à chaque seconde. */
.countdown {
  min-height: 70vh;
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
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 420px;
  margin: 0 auto;
}
.meta {
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
.fork {
  margin: -4px 0 0;
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
.feedback {
  min-height: 64px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 18px;
}
.next-hint {
  margin-top: 12px;
  background: none;
  border: none;
  color: var(--ion-color-medium);
  font-size: 14px;
  cursor: pointer;
}
.game {
  touch-action: pan-y;
}
.feedback.ok strong {
  color: var(--ion-color-success);
}
.feedback.ko strong {
  color: var(--ion-color-danger);
}
</style>
