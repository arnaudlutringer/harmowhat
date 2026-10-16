<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="top">
        <ion-button fill="clear" router-link="/infos" aria-label="Informations" title="Informations">
          <ion-icon slot="icon-only" :icon="informationCircleOutline" />
        </ion-button>
        <div class="brand">
          <img class="logo" src="/logo.svg" alt="" />
          <h1>L'oreille</h1>
        </div>
        <ion-button fill="clear" router-link="/parametres" aria-label="Paramètres" title="Paramètres">
          <ion-icon slot="icon-only" :icon="settingsOutline" />
        </ion-button>
      </div>
      <p class="intro">Tu penses avoir l'oreille absolue&nbsp;? Prouve-le&nbsp;!</p>
      <!-- Les jeux, rangés par catégorie : l'oreille (on écoute), le solfège (on lit la partition). -->
      <section v-for="category in categories" :key="category.title" class="category">
        <h2>{{ category.title }}</h2>
        <div class="games">
          <ion-card v-for="game in category.games" :key="game.path" button :router-link="game.path" :style="{ '--background': game.color }">
            <ion-card-header>
              <div class="emoji" aria-hidden="true">{{ game.emoji }}</div>
              <ion-card-title>{{ game.title }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>{{ game.description }}</ion-card-content>
          </ion-card>
        </div>
      </section>
      <ion-button class="hall" expand="block" router-link="/hall-of-fame">
        <ion-icon slot="start" :icon="trophyOutline" />
        Hall of fame
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonPage,
} from '@ionic/vue'
import { informationCircleOutline, settingsOutline, trophyOutline } from 'ionicons/icons'
import { GAMES } from '@/games/highScores'

const earGames = [
  {
    path: '/games/grave-ou-aigu',
    color: 'var(--hw-game-1)',
    emoji: GAMES['grave-ou-aigu'].emoji,
    title: 'Grave ou aigu ?',
    description: 'La note jouée est-elle plus grave ou plus aiguë que le La3 du diapason ?',
  },
  {
    path: '/games/quelle-note',
    color: 'var(--hw-game-2)',
    emoji: GAMES['quelle-note'].emoji,
    title: 'Quelle est la note ?',
    description: 'Retrouve la note jouée parmi plusieurs propositions.',
  },
  {
    path: '/games/accords',
    color: 'var(--hw-game-3)',
    emoji: GAMES['accords'].emoji,
    title: 'Les accords',
    description: 'Trois notes jouées ensemble, entre La2 et La4 : retrouve-les toutes les trois.',
  },
  {
    path: '/games/harmonies',
    color: 'var(--hw-game-4)',
    emoji: GAMES['harmonies'].emoji,
    title: 'Les harmonies',
    description: "Deux notes l'une après l'autre : trouve l'intervalle (tierce, quinte, sixte…).",
  },
]

const theoryGames = [
  {
    path: '/games/lecture-note',
    color: 'var(--hw-game-5)',
    emoji: GAMES['lecture-note'].emoji,
    title: 'Lecture de note',
    description: "Une note sur une portée, en clé de sol, de fa ou d'ut : quelle est cette note ?",
  },
]

const categories = [
  { title: "L'oreille", games: earGames },
  { title: 'Le solfège', games: theoryGames },
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
/* Même police manuscrite que le titre, un peu plus grande que le texte courant pour rester lisible. */
.intro {
  font-family: 'Dancing Script', cursive;
  font-size: 22px;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-align: center;
}
/* Titre de catégorie : la police manuscrite du titre, en violet. */
.category h2 {
  margin: 20px 0 10px;
  font-family: 'Dancing Script', cursive;
  font-size: 28px;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.category:first-of-type h2 {
  margin-top: 4px;
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
/* En-tête de carte : l'icône du jeu à gauche, son titre à droite, aligné à droite. */
ion-card-header {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 14px 12px 8px;
}
ion-card-title {
  flex: 1;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  text-align: right;
}
ion-card-content {
  color: #fff;
  padding: 0 12px 14px;
  font-size: 13px;
  line-height: 1.35;
}
.emoji {
  flex: none;
  font-size: 30px;
  line-height: 1;
  text-shadow: none;
}
.hall {
  margin: 20px 0 0;
  --border-radius: 0;
  font-weight: 700;
}
/* Titre à gauche, Paramètres et Infos à droite, sur la même ligne. */
/* Infos en haut à gauche, Paramètres en haut à droite, logo et titre centrés entre les deux. */
.top {
  display: flex;
  align-items: flex-start;
}
.brand {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo {
  width: 64px;
  height: 64px;
}
.top ion-button {
  --color: var(--ion-color-primary);
  margin: 0;
}
</style>
