<template>
  <ion-page>
    <ion-content>
      <div class="page">
        <header class="top">
          <button class="back" aria-label="Retour à l'accueil" @click="router.navigate('/home', 'back', 'replace')">
            <ion-icon :icon="chevronBack" aria-hidden="true" />
          </button>
          <div class="heading">
            <h1>{{ family.title }}</h1>
            <p>{{ games.length }} jeux · {{ medalsText(games) }}</p>
          </div>
          <span class="spacer" />
        </header>

        <div class="games">
          <!-- Nombre impair de jeux : le dernier prend toute la largeur. -->
          <router-link
            v-for="(game, i) in games"
            :key="game"
            :to="`/games/${game}`"
            class="card"
            :class="{ wide: games.length % 2 === 1 && i === games.length - 1 }"
            :style="{ background: colorOf(game) }"
          >
            <span class="disc"><ion-icon :icon="GAME_ICONS[game]" aria-hidden="true" /></span>
            <span class="text">
              <strong>{{ GAMES[game].title }}</strong>
              <span class="blurb">{{ BLURBS[game] }}</span>
              <span class="medals" :aria-label="medalLabel(game)">
                <span v-for="m in gameMedals(game)" :key="m.medal" :class="{ off: !m.won }">{{ m.medal }}</span>
              </span>
            </span>
          </router-link>
        </div>
      </div>
    </ion-content>
    <bottom-nav active="/home" nested />
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/vue'
import { chevronBack } from 'ionicons/icons'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import { BLURBS, FAMILIES, familyGames, familyPath, gameMedals, medalsText } from '@/games/catalog'
import { GAMES, type GameId } from '@/games/highScores'
import { GAME_ICONS } from '@/games/icons'
import { gameCategory } from '@/games/trophies'

/** La liste des jeux d'une famille : une adresse par famille, donc un écran par famille. */
const router = useIonRouter()
const ownPath = useRoute().path
const family = FAMILIES.find((f) => familyPath(f) === ownPath) ?? FAMILIES[0]
const games = familyGames(family)

// Chaque jeu garde la teinte de ses réglages (dans « Rythme et tempo », deux teintes).
const CATEGORY_VARS = ['--hw-category-ear', '--hw-category-voice', '--hw-category-theory', '--hw-category-rhythm', '--hw-category-tempo']
const colorOf = (game: GameId) => `var(${CATEGORY_VARS[gameCategory(game)] ?? CATEGORY_VARS[0]})`

function medalLabel(game: GameId) {
  const won = gameMedals(game).filter((m) => m.won).map((m) => m.medal)
  return won.length ? `Médailles gagnées : ${won.join(' ')}` : 'Pas encore de médaille'
}
</script>

<style scoped>
.page {
  padding: 12px 16px 16px;
}
.top {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.back {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: none;
  color: var(--ion-color-primary);
  font-size: 26px;
  cursor: pointer;
}
.spacer {
  width: 44px;
}
.heading {
  flex: 1;
  text-align: center;
}
h1 {
  margin: 0;
  font-family: 'Dancing Script', cursive;
  font-size: 36px;
  line-height: 1.1;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.heading p {
  margin: 0;
  font-size: 13px;
  color: var(--ion-color-medium);
}
.games {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
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
.card.wide {
  grid-column: span 2;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}
.disc {
  flex: none;
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
.text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-self: stretch;
}
.text strong {
  font-size: 16px;
  line-height: 1.15;
}
.blurb {
  flex: 1;
  font-size: 13px;
  line-height: 1.25;
}
.medals {
  font-size: 13px;
  letter-spacing: 2px;
}
.medals .off {
  filter: grayscale(1);
  opacity: 0.35;
}
</style>
