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
        <span class="spacer" />
      </div>
      <p class="intro">Tu penses avoir l'oreille absolue&nbsp;? Prouve-le&nbsp;!</p>

      <!-- Défi du jour : le même jeu et le même niveau pour tout le monde, jusqu'à minuit. -->
      <button class="daily" :class="{ done: challengeDone }" @click="router.push(challenge.href)">
        <ion-icon class="daily-icon" :icon="GAME_ICONS[challenge.board.game]" aria-hidden="true" />
        <span class="daily-text">
          <small>{{ challengeDone ? 'DÉFI DU JOUR RELEVÉ ✓' : 'DÉFI DU JOUR' }}</small>
          <strong>{{ challenge.title }} · {{ challenge.level }}</strong>
          <span>{{ challenge.board.questions }} questions · {{ challengeDone ? 'reviens demain pour le suivant' : '80 % de bonnes réponses pour le relever' }}</span>
        </span>
        <span class="daily-note" aria-hidden="true">♪</span>
      </button>

      <!-- Les jeux, rangés par catégorie : l'oreille, la voix, le solfège, le rythme, le tempo. -->
      <section v-for="category in categories" :key="category.title" class="category">
        <h2>{{ category.title }} <small>{{ category.games.length }} jeux</small></h2>
        <div class="games">
          <router-link v-for="game in category.games" :key="game.path" :to="game.path" class="card" :style="{ background: category.color }" :title="SUMMARIES[idOf(game.path)]">
            <span class="disc"><ion-icon :icon="game.icon" aria-hidden="true" /></span>
            <strong>{{ game.title }}</strong>
            <!-- Médailles GOAT déjà gagnées sur ce jeu (bronze, argent, or, puis diamant en impossible). -->
            <span class="medals" :aria-label="medalLabel(game.path)">
              <span v-for="m in medalsFor(game.path)" :key="m.medal" :class="{ off: !m.won }">{{ m.medal }}</span>
            </span>
          </router-link>
        </div>
      </section>
    </ion-content>
    <bottom-nav active="/home" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/vue'
import { informationCircleOutline } from 'ionicons/icons'
import BottomNav from '@/components/BottomNav.vue'
import { GAME_ICONS } from '@/games/icons'
import { SUMMARIES } from '@/games/intros'
import type { GameId } from '@/games/highScores'
import { dailyChallenge, dayNumber } from '@/games/dailyChallenge'
import { challengeDays, earnedTrophies, impossibleUnlocked, LEVEL_MEDALS, levelMedalWon, type Tier } from '@/games/trophies'

const router = useIonRouter()
const challenge = dailyChallenge()
const challengeDone = computed(() => challengeDays.value.includes(dayNumber()))

const TIERS: Tier[] = ['debutant', 'normal', 'expert', 'impossible']
const idOf = (path: string) => path.replace('/games/', '') as GameId
/**
 * Médailles d'un jeu : bronze, argent et or (un sans faute en débutant, normal, expert), la couronne en impossible
 * une fois ce niveau débloqué, puis le diamant du GOAT.
 */
function medalsFor(path: string) {
  const id = idOf(path)
  const levels = TIERS.filter((t) => t !== 'impossible' || impossibleUnlocked.value.includes(id))
  return [
    ...levels.map((t) => ({ medal: LEVEL_MEDALS[t].medal, won: levelMedalWon(id, t) })),
    { medal: '💎', won: !!earnedTrophies.value[`goat-${id}`] },
  ]
}
function medalLabel(path: string) {
  const won = medalsFor(path).filter((m) => m.won).map((m) => m.medal)
  return won.length ? `Médailles gagnées : ${won.join(' ')}` : 'Pas encore de médaille'
}

const earGames = [
  {
    path: '/games/grave-ou-aigu',
    icon: GAME_ICONS['grave-ou-aigu'],
    title: 'Grave ou aigu ?',
  },
  {
    path: '/games/quelle-note',
    icon: GAME_ICONS['quelle-note'],
    title: 'Quelle est la note ?',
  },
  {
    path: '/games/accords',
    icon: GAME_ICONS.accords,
    title: 'Les accords',
  },
  {
    path: '/games/harmonies',
    icon: GAME_ICONS.harmonies,
    title: 'Les harmonies',
  },
  {
    path: '/games/modalite',
    icon: GAME_ICONS.modalite,
    title: 'La modalité',
  },
]

const voiceGames = [
  {
    path: '/games/chante-note',
    icon: GAME_ICONS['chante-note'],
    title: 'Chante la note',
  },
  {
    path: '/games/chante-harmonie',
    icon: GAME_ICONS['chante-harmonie'],
    title: "Chante l'harmonie",
  },
]

const theoryGames = [
  {
    path: '/games/lecture-note',
    icon: GAME_ICONS['lecture-note'],
    title: 'Lecture de note',
  },
  {
    path: '/games/fais-harmonie',
    icon: GAME_ICONS['fais-harmonie'],
    title: "Fais l'harmonie",
  },
  {
    path: '/games/tonalite',
    icon: GAME_ICONS.tonalite,
    title: 'La tonalité',
  },
]

const rhythmGames = [
  {
    path: '/games/quel-rythme',
    icon: GAME_ICONS['quel-rythme'],
    title: 'Quel rythme ?',
  },
  {
    path: '/games/joue-rythme',
    icon: GAME_ICONS['joue-rythme'],
    title: 'Joue le rythme',
  },
]

const tempoGames = [
  {
    path: '/games/garde-tempo',
    icon: GAME_ICONS['garde-tempo'],
    title: 'Garde le tempo',
  },
  {
    path: '/games/trouve-tempo',
    icon: GAME_ICONS['trouve-tempo'],
    title: 'Trouve le tempo',
  },
]

// Une teinte douce par catégorie, un peu plus foncée que le fond crème.
const categories = [
  { title: "L'oreille", color: 'var(--hw-category-ear)', games: earGames },
  { title: 'La voix', color: 'var(--hw-category-voice)', games: voiceGames },
  { title: 'Le solfège', color: 'var(--hw-category-theory)', games: theoryGames },
  { title: 'Le rythme', color: 'var(--hw-category-rhythm)', games: rhythmGames },
  { title: 'Le tempo', color: 'var(--hw-category-tempo)', games: tempoGames },
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
  margin: 4px 0 12px;
  font-family: 'Dancing Script', cursive;
  font-size: 20px;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-align: center;
}
/* Défi du jour : un bandeau sombre, la note en filigrane. */
.daily {
  position: relative;
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 4px 0 8px;
  padding: 14px 16px;
  border: none;
  border-radius: 20px;
  background: var(--hw-daily, #2d3047);
  color: #fff;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(45, 48, 71, 0.25);
}
.daily-icon {
  flex: none;
  font-size: 48px;
  color: #fff;
}
.daily-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.daily-text small {
  color: #f2c94c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}
.daily-text strong {
  font-size: 17px;
}
.daily-text span {
  font-size: 12px;
  opacity: 0.75;
}
.daily.done .daily-text small {
  color: #7bd88f;
}
.daily-note {
  position: absolute;
  right: -4px;
  bottom: -26px;
  font-size: 96px;
  opacity: 0.08;
}
/* Titre de catégorie : la police manuscrite du titre, en violet, et le nombre de jeux à droite. */
.category h2 {
  display: flex;
  align-items: baseline;
  margin: 18px 0 10px;
  font-family: 'Dancing Script', cursive;
  font-size: 28px;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.category h2 small {
  margin-left: auto;
  font-family: var(--ion-font-family);
  font-size: 12px;
  font-weight: 400;
  color: var(--ion-color-medium);
}
.games {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
/* Carte d'un jeu : coins arrondis, la teinte de sa catégorie, l'icône dans un rond blanc, les médailles. */
.card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: 18px;
  color: var(--hw-card-ink);
  text-decoration: none;
  box-shadow: 0 3px 10px rgba(45, 48, 71, 0.08);
}
.card:active {
  transform: scale(0.98);
}
/* Un reflet clair dans le coin, pour donner du relief. */
.card::after {
  content: '';
  position: absolute;
  right: -26px;
  top: -26px;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}
.disc {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--hw-surface, #fff);
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.12);
}
.disc ion-icon {
  font-size: 32px;
  color: var(--hw-card-ink);
}
.card strong {
  font-size: 16px;
  line-height: 1.15;
}
.medals {
  font-size: 13px;
  letter-spacing: 2px;
}
.medals .off {
  filter: grayscale(1);
  opacity: 0.35;
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
/* Même largeur que le bouton Infos : le titre reste centré. */
.spacer {
  width: 48px;
}
</style>
