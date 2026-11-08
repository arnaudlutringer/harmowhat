<template>
  <ion-page>
    <ion-content>
      <div class="page">
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
      <!-- Défi du jour : le même jeu et le même niveau pour tout le monde, jusqu'à minuit. -->
      <!-- Une fois terminé, il se replie en une ligne jusqu'à minuit, avec le meilleur résultat du jour. -->
      <p v-if="todayScore" class="daily-done" :class="{ failed: !challengeDone }">
        {{ challengeDone ? '✓ Défi du jour relevé' : 'Défi du jour terminé' }} · {{ todayScore.correct }}/{{ todayScore.total }}
        <small>· {{ challenge.title }} · reviens demain pour le suivant</small>
      </p>
      <button v-else class="daily" @click="router.push(challenge.href)">
        <ion-icon class="daily-icon" :icon="GAME_ICONS[challenge.board.game]" aria-hidden="true" />
        <span class="daily-text">
          <small>DÉFI DU JOUR</small>
          <strong>{{ challenge.title }} · {{ challenge.level }}</strong>
          <span>{{ challenge.board.questions }} questions · 80 % pour le relever</span>
        </span>
        <span class="daily-note" aria-hidden="true">♪</span>
      </button>

      <!-- Le dernier jeu lancé, à un geste (absente avant la première partie). -->
      <router-link v-if="last" :to="`/games/${last}`" class="again">
        <span class="again-disc"><ion-icon :icon="play" aria-hidden="true" /></span>
        <span class="again-text">
          <small>Rejouer</small>
          <strong>{{ GAMES[last].title }}</strong>
        </span>
        <ion-icon class="again-go" :icon="chevronForward" aria-hidden="true" />
      </router-link>

      <!-- Les quatre familles : chacune ouvre la liste de ses jeux. -->
      <nav class="families" aria-label="Familles de jeux">
        <router-link v-for="f in families" :key="f.id" :to="f.path" class="family" :style="{ background: f.color }">
          <span class="disc"><ion-icon :icon="f.icon" aria-hidden="true" /></span>
          <span class="family-text">
            <strong>{{ f.title }}</strong>
            <span>{{ f.games.length }} jeux · {{ medalsText(f.games) }}</span>
          </span>
        </router-link>
      </nav>

      <!-- Écrans de mise au point, derrière un interrupteur. -->
      <router-link v-if="debug" to="/debug/micro" class="debug">Test du micro</router-link>
      </div>
    </ion-content>
    <bottom-nav active="/home" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonContent, IonIcon, IonPage, useIonRouter } from '@ionic/vue'
import { chevronForward, earOutline, informationCircleOutline, micOutline, musicalNotesOutline, play } from 'ionicons/icons'
import BottomNav from '@/components/BottomNav.vue'
import { GAME_ICONS } from '@/games/icons'
import { FAMILIES, familyGames, familyPath, lastGame, medalsText } from '@/games/catalog'
import { GAMES } from '@/games/highScores'
import { dayNumber, todaysChallenge } from '@/games/dailyChallenge'
import { featureEnabled, gameEnabled } from '@/config/features'
import { challengeDays, challengeScores } from '@/games/trophies'

const router = useIonRouter()
// Le défi du jour, figé pour la journée (son niveau suit les progrès du joueur d'un jour à l'autre).
const challenge = todaysChallenge()
const challengeDone = computed(() => challengeDays.value.includes(dayNumber()))
/** Meilleur résultat du défi d'aujourd'hui (le défi est terminé dès qu'il existe). */
const todayScore = computed(() => challengeScores.value[dayNumber()] ?? (challengeDone.value ? { correct: challenge.board.questions, total: challenge.board.questions } : null))

const FAMILY_ICONS: Record<string, string> = { oreille: earOutline, voix: micOutline, solfege: musicalNotesOutline, rythme: GAME_ICONS['garde-tempo'] }
const families = FAMILIES.map((f) => ({ ...f, path: familyPath(f), icon: FAMILY_ICONS[f.id], games: familyGames(f) }))
const last = computed(() => (lastGame.value && gameEnabled(lastGame.value) ? lastGame.value : null))
const debug = featureEnabled('testMicro')
</script>

<style scoped>
h1 {
  margin: 0;
  font-family: 'Dancing Script', cursive;
  font-size: 34px;
  font-weight: 700;
  color: var(--ion-color-primary);
}
/* Tout tient sur l'écran : les familles se partagent la hauteur qui reste. */
.page {
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 12px;
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
/* Défi relevé : une seule ligne discrète, en vert. */
.daily-done {
  margin: 4px 0 8px;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
  color: var(--ion-color-success);
  font-weight: 700;
  font-size: 14px;
}
/* Défi terminé sans être relevé : le score en violet, sans coche. */
.daily-done.failed {
  color: var(--ion-color-primary);
}
.daily-done small {
  font-weight: 400;
  color: var(--ion-color-medium);
}
.daily-note {
  position: absolute;
  right: -4px;
  bottom: -26px;
  font-size: 96px;
  opacity: 0.08;
}
/* Le dernier jeu lancé. */
.again {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  box-sizing: border-box;
  padding: 8px 14px 8px 8px;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  color: var(--hw-card-ink);
  text-decoration: none;
  box-shadow: 0 3px 10px rgba(45, 48, 71, 0.08);
}
.again-disc {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: #fff;
  font-size: 20px;
}
.again-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.again-text small {
  font-size: 12px;
  color: var(--ion-color-medium);
}
.again-text strong {
  font-size: 16px;
  font-weight: 600;
}
.again-go {
  font-size: 20px;
  color: var(--ion-color-medium);
}
/* Les familles, en 2 × 2. */
.families {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: minmax(132px, 1fr);
  gap: 12px;
}
.family {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 14px;
  border-radius: 20px;
  color: var(--hw-card-ink);
  text-decoration: none;
  box-shadow: 0 3px 10px rgba(45, 48, 71, 0.08);
}
.family:active {
  transform: scale(0.98);
}
.family-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}
.family-text strong {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.1;
}
.debug {
  text-align: center;
  font-size: 13px;
  color: var(--ion-color-medium);
}
/* Petit écran (Samsung A10) : tout tient sans défilement, en réduisant le logo et les cartes. */
@media (max-height: 740px) {
  .page {
    gap: 10px;
    padding: 8px 16px;
  }
  .page .logo {
    width: 44px;
    height: 44px;
  }
  .page h1 {
    font-size: 28px;
  }
  .daily {
    margin: 0;
    padding: 10px 14px;
  }
  .daily-done {
    margin: 0;
  }
  .families {
    grid-auto-rows: minmax(112px, 1fr);
    gap: 10px;
  }
  .family {
    padding: 10px 12px;
    gap: 6px;
  }
  .family .disc {
    width: 44px;
    height: 44px;
  }
  .family .disc ion-icon {
    font-size: 28px;
  }
  .family-text strong {
    font-size: 18px;
  }
}
.disc {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--hw-surface, #fff);
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.12);
}
.disc ion-icon {
  font-size: 34px;
  color: var(--hw-card-ink);
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
