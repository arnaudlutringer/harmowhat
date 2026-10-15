<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/games/${game.slug}`" text="" />
        </ion-buttons>
        <ion-title>{{ game.title }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="ready hw-square">
        <button class="play fork" :class="{ 'is-playing': playing }" aria-label="Écouter le diapason, La3 440 Hz" @click="listen">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 2v8a4 4 0 0 0 8 0V2" />
            <path d="M12 14v8" />
          </svg>
        </button>
        <h2>Le diapason : La3, 440 Hz</h2>
        <p>
          <strong>Pas de diapason pendant les questions.</strong>
          C'est ici, et seulement ici, que tu peux l'écouter. Écoute-le autant de fois que tu veux, puis lance-toi.
        </p>
        <ion-button expand="block" size="large" @click="start">Je suis prêt</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, onIonViewWillLeave, useIonRouter,
} from '@ionic/vue'
import { playTuningFork, stopAll } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'
import { readyGame } from '@/games/ready'

const route = useRoute()
const game = readyGame(route.params.game)
const router = useIonRouter()
const { playing, track } = usePlaying()

function listen() {
  track(playTuningFork())
}

/** Lance le jeu avec les réglages choisis (transmis tels quels). */
function start() {
  const query = new URLSearchParams(route.query as Record<string, string>).toString()
  router.push(`/games/${game.slug}/jouer${query ? `?${query}` : ''}`)
}

onIonViewWillLeave(stopAll)
</script>

<style scoped>
.ready {
  max-width: 420px;
  margin: 8vh auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.fork {
  width: 140px;
  height: 140px;
  display: grid;
  place-items: center;
}
.fork svg {
  width: 72px;
  height: 72px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
h2 {
  margin: 24px 0 8px;
  font-size: 20px;
}
p {
  margin: 0 0 32px;
  color: var(--ion-color-medium);
}
ion-button {
  width: 100%;
}
</style>
