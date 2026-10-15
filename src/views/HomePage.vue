<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="top">
        <img class="logo" src="/logo.svg" alt="" />
        <h1>HarmoWhat</h1>
        <ion-button fill="clear" router-link="/parametres" aria-label="Paramètres" title="Paramètres">
          <ion-icon slot="icon-only" :icon="settingsOutline" />
        </ion-button>
        <ion-button fill="clear" router-link="/infos" aria-label="Informations" title="Informations">
          <ion-icon slot="icon-only" :icon="informationCircleOutline" />
        </ion-button>
      </div>
      <p class="intro">Teste ton oreille avec des mini-jeux de 20 questions.</p>
      <div class="games">
        <ion-card v-for="game in games" :key="game.path" button :router-link="game.path" :style="{ '--background': game.color }">
          <ion-card-header>
            <div class="emoji" aria-hidden="true">{{ game.emoji }}</div>
            <ion-card-title>{{ game.title }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>{{ game.description }}</ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonPage,
} from '@ionic/vue'
import { informationCircleOutline, settingsOutline } from 'ionicons/icons'

const games = [
  {
    path: '/games/grave-ou-aigu',
    color: 'var(--hw-game-1)',
    emoji: '↕️',
    title: 'Grave ou aigu ?',
    description: 'La note jouée est-elle plus grave ou plus aiguë que le La3 du diapason ?',
  },
  {
    path: '/games/quelle-note',
    color: 'var(--hw-game-2)',
    emoji: '🎹',
    title: 'Quelle est la note ?',
    description: 'Retrouve la note jouée parmi plusieurs propositions. Choisis le nombre de questions et ton niveau.',
  },
  {
    path: '/games/accords',
    color: 'var(--hw-game-3)',
    emoji: '🎼',
    title: 'Les accords',
    description: 'Trois notes jouées ensemble, entre La2 et La4 : retrouve-les toutes les trois.',
  },
  {
    path: '/games/harmonies',
    color: 'var(--hw-game-4)',
    emoji: '🎵',
    title: 'Les harmonies',
    description: "Deux notes l'une après l'autre : trouve l'intervalle (tierce, quinte, sixte…).",
  },
]
</script>

<style scoped>
h1 {
  margin: 0;
  font-family: 'Dancing Script', cursive;
  font-size: 34px;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.intro {
  color: var(--ion-color-medium);
}
.games {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
/* Cartes des jeux : angles droits, une couleur vive par jeu, texte blanc. */
ion-card {
  margin: 0;
  border-radius: 0;
  --color: #fff;
  box-shadow: 0 6px 16px rgba(45, 48, 71, 0.15);
}
ion-card-header {
  padding: 14px 12px 6px;
}
ion-card-title {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}
ion-card-content {
  color: #fff;
  padding: 0 12px 14px;
  font-size: 13px;
  line-height: 1.35;
}
.emoji {
  font-size: 30px;
  margin-bottom: 6px;
  text-shadow: none;
}
/* Titre à gauche, Paramètres et Infos à droite, sur la même ligne. */
.top {
  display: flex;
  align-items: center;
}
.top h1 {
  flex: 1;
}
.logo {
  width: 36px;
  height: 36px;
  margin-right: 10px;
}
.top ion-button {
  --color: var(--ion-color-primary);
  margin: 0;
}
</style>
