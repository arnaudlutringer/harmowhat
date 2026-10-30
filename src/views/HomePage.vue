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
      <p class="intro">Tu penses avoir l'oreille absolue&nbsp;?<br />Prouve-le&nbsp;!</p>
      <!-- Les jeux, rangés par catégorie : l'oreille (on écoute), la voix (on chante), le solfège (on lit la partition). -->
      <section v-for="category in categories" :key="category.title" class="category">
        <h2>{{ category.title }}</h2>
        <div class="games">
          <ion-card v-for="game in category.games" :key="game.path" button :router-link="game.path" :style="{ '--background': category.color }">
            <ion-card-header>
              <ion-card-title>{{ game.title }}</ion-card-title>
              <ion-icon class="icon" :icon="game.icon" aria-hidden="true" />
            </ion-card-header>
            <ion-card-content>{{ game.description }}</ion-card-content>
          </ion-card>
        </div>
      </section>
      <!-- Hall of fame et Mes trophées, côte à côte, chacun sur la moitié de l'écran. -->
      <div class="bottom">
        <ion-button class="hall" router-link="/hall-of-fame">
          <ion-icon slot="start" :icon="trophyOutline" />
          Hall of fame
        </ion-button>
        <ion-button class="hall" fill="outline" router-link="/trophees" data-trophy-target>
          <ion-icon slot="start" :icon="medalOutline" />
          Mes trophées
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonPage,
} from '@ionic/vue'
import { informationCircleOutline, medalOutline, settingsOutline, trophyOutline } from 'ionicons/icons'
import { GAME_ICONS } from '@/games/icons'

const earGames = [
  {
    path: '/games/grave-ou-aigu',
    icon: GAME_ICONS['grave-ou-aigu'],
    title: 'Grave ou aigu ?',
    description: 'La note jouée est-elle plus grave ou plus aiguë que le La3 du diapason ?',
  },
  {
    path: '/games/quelle-note',
    icon: GAME_ICONS['quelle-note'],
    title: 'Quelle est la note ?',
    description: 'Retrouve la note jouée parmi plusieurs propositions.',
  },
  {
    path: '/games/accords',
    icon: GAME_ICONS.accords,
    title: 'Les accords',
    description: 'Trois notes jouées ensemble, entre La2 et La4 : retrouve-les toutes les trois.',
  },
  {
    path: '/games/harmonies',
    icon: GAME_ICONS.harmonies,
    title: 'Les harmonies',
    description: "Deux notes l'une après l'autre : trouve l'intervalle (tierce, quinte, sixte…).",
  },
  {
    path: '/games/modalite',
    icon: GAME_ICONS.modalite,
    title: 'La modalité',
    description: "Devine la modalité à l'oreille.",
  },
]

const voiceGames = [
  {
    path: '/games/chante-note',
    icon: GAME_ICONS['chante-note'],
    title: 'Chante la note',
    description: 'Chante dans le micro la note demandée, au plus juste.',
  },
  {
    path: '/games/chante-harmonie',
    icon: GAME_ICONS['chante-harmonie'],
    title: "Chante l'harmonie",
    description: 'Une note est jouée : chante celle qui forme l’intervalle demandé (la quinte, la tierce majeure…).',
  },
]

const theoryGames = [
  {
    path: '/games/lecture-note',
    icon: GAME_ICONS['lecture-note'],
    title: 'Lecture de note',
    description: "Une note sur une portée, en clé de sol, de fa ou d'ut : quelle est cette note ?",
  },
  {
    path: '/games/fais-harmonie',
    icon: GAME_ICONS['fais-harmonie'],
    title: "Fais l'harmonie",
    description: 'Une note sur une portée et un intervalle : quelle note forme cette harmonie (la quinte du Do, la septième du Ré♯…) ?',
  },
  {
    path: '/games/tonalite',
    icon: GAME_ICONS.tonalite,
    title: 'La tonalité',
    description: "Trouve la tonalité en regardant l'armure de la portée : ses dièses, ses bémols… ou rien.",
  },
]

const rhythmGames = [
  {
    path: '/games/quel-rythme',
    icon: GAME_ICONS['quel-rythme'],
    title: 'Quel rythme ?',
    description: 'Écoute un rythme de 3 temps et retrouve ses figures : noire, croches, soupir…',
  },
  {
    path: '/games/joue-rythme',
    icon: GAME_ICONS['joue-rythme'],
    title: 'Joue le rythme',
    description: 'Lis le rythme écrit et tape-le en mesure, au plus juste.',
  },
]

// Une teinte douce par catégorie, un peu plus foncée que le fond crème.
const categories = [
  { title: "L'oreille", color: 'var(--hw-category-ear)', games: earGames },
  { title: 'La voix', color: 'var(--hw-category-voice)', games: voiceGames },
  { title: 'Le solfège', color: 'var(--hw-category-theory)', games: theoryGames },
  { title: 'Le rythme', color: 'var(--hw-category-rhythm)', games: rhythmGames },
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
/* Cartes des jeux : angles droits, la teinte douce de leur catégorie, texte et icône foncés. */
ion-card {
  margin: 0;
  border-radius: 0;
  --color: var(--hw-card-ink);
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.08);
}
/* En-tête de carte : le titre du jeu à gauche, son icône à droite. */
ion-card-header {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px;
}
ion-card-title {
  flex: 1;
  color: var(--hw-card-ink);
  font-size: 18px;
  font-weight: 700;
  text-align: left;
}
ion-card-content {
  color: var(--hw-card-ink);
  padding: 0 12px 12px;
  font-size: 10.5px;
  line-height: 1.35;
}
/* Icône au trait, de la couleur du texte. */
.icon {
  flex: none;
  font-size: 36px;
  color: var(--hw-card-ink);
}
.bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}
.hall {
  margin: 0;
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
