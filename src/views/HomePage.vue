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
      <!-- Défi du jour : le même jeu et le même niveau pour tout le monde, jusqu'à minuit. -->
      <!-- Une fois terminé, il se replie en une ligne jusqu'à minuit, avec le meilleur résultat du jour. -->
      <p v-if="todayScore" class="daily-done" :class="{ failed: !challengeDone }">
        {{ challengeDone ? '✓ Défi du jour relevé' : 'Défi du jour terminé' }} · {{ todayScore.correct }}/{{ todayScore.total }}
        <small>· {{ challenge.title }} · reviens demain pour le suivant</small>
      </p>
      <button v-else class="daily" @click="router.push(challenge.href)">
        <ion-icon class="daily-icon" :icon="GAME_ICONS[challenge.board.game]" aria-hidden="true" />
        <span class="daily-text">
          <small>DÉFI DU JOUR · {{ challenge.board.questions }} QUESTIONS</small>
          <strong>{{ challenge.title }} · {{ challenge.level }}</strong>
        </span>
        <span class="daily-note" aria-hidden="true">♪</span>
      </button>

      <!-- Tous les jeux, rangés par catégorie : une ligne par paire de jeux, pour les voir d'un coup d'œil. -->
      <section v-for="category in categories" :key="category.title" class="category">
        <h2>{{ category.title }}</h2>
        <div class="games">
          <router-link v-for="game in category.games" :key="game.path" :to="game.path" class="card" :style="{ background: category.color }" :title="SUMMARIES[idOf(game.path)]">
            <span class="head">
              <span class="disc"><ion-icon :icon="game.icon" aria-hidden="true" /></span>
              <strong>{{ game.title }}</strong>
              <!-- Le symbole de la catégorie, en filigrane à droite de la tuile. -->
              <ion-icon v-if="category.icon" class="category-mark" :icon="category.icon" aria-hidden="true" />
            </span>
            <!-- En bas de la tuile, un bandeau blanc : les parties à gauche, les médailles en points de couleur à droite. -->
            <span v-if="!category.tests" class="strip">
              <small>🎮 <b>{{ playsOf(game.path) }}</b> partie{{ playsOf(game.path) > 1 ? 's' : '' }}</small>
              <span class="dots" role="img" :aria-label="medalLabel(game.path)">
                <medal-dot v-for="m in medalsFor(game.path)" :key="m.kind" :kind="m.kind" :won="m.won" :size="11" label="" aria-hidden="true" />
              </span>
            </span>
          </router-link>
        </div>
      </section>
    </ion-content>
    <bottom-nav active="/home" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonButton, IonContent, IonIcon, IonPage, onIonViewWillEnter, useIonRouter } from '@ionic/vue'
import { informationCircleOutline } from 'ionicons/icons'
import BottomNav from '@/components/BottomNav.vue'
import MedalDot, { type MedalKind } from '@/components/MedalDot.vue'
import { GAME_ICONS } from '@/games/icons'
import { CATEGORY_ICONS } from '@/games/categoryIcons'
import { SUMMARIES } from '@/games/intros'
import type { GameId } from '@/games/highScores'
import { dayNumber, todaysChallenge } from '@/games/dailyChallenge'
import { featureEnabled, gameEnabled } from '@/config/features'
import { challengeDays, challengeScores, diamondShown, earnedTrophies, gamesPlayed, impossibleUnlocked, LEVEL_MEDALS, levelMedalWon, type Tier } from '@/games/trophies'

const router = useIonRouter()
// Le défi du jour, figé pour la journée (son niveau suit les progrès du joueur d'un jour à l'autre).
const challenge = todaysChallenge()
const challengeDone = computed(() => challengeDays.value.includes(dayNumber()))
/** Meilleur résultat du défi d'aujourd'hui (le défi est terminé dès qu'il existe). */
const todayScore = computed(() => challengeScores.value[dayNumber()] ?? (challengeDone.value ? { correct: challenge.board.questions, total: challenge.board.questions } : null))

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
    ...levels.map((t) => ({ kind: t as MedalKind, name: LEVEL_MEDALS[t].name, won: levelMedalWon(id, t) })),
    // Le diamant n'apparaît qu'une fois la médaille d'or gagnée.
    ...(diamondShown(id) ? [{ kind: 'goat' as MedalKind, name: 'Diamant', won: !!earnedTrophies.value[`goat-${id}`] }] : []),
  ]
}
// L'écran reste en mémoire : le nombre de parties se relit à chaque retour sur l'accueil.
const refresh = ref(0)
onIonViewWillEnter(() => refresh.value++)
function playsOf(path: string) {
  void refresh.value
  return gamesPlayed(idOf(path))
}
function medalLabel(path: string) {
  const won = medalsFor(path).filter((m) => m.won).map((m) => m.name.toLowerCase())
  return won.length ? `Gagné : ${won.join(', ')}` : 'Pas encore de médaille'
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
  {
    path: '/games/lis-chante',
    icon: GAME_ICONS['lis-chante'],
    title: 'Chante en continu',
  },
].filter((g) => gameEnabled(idOf(g.path)))

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
  {
    path: '/games/lis-dis',
    icon: GAME_ICONS['lis-dis'],
    title: 'Lecture continue',
  },
].filter((g) => gameEnabled(idOf(g.path)))

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

// Une couleur vive par catégorie, assez soutenue pour que le nom des jeux se lise en blanc.
interface HomeGame {
  path: string
  icon: string
  title: string
}
const categories: { title: string; color: string; icon?: string; tests?: boolean; games: HomeGame[] }[] = [
  { title: "L'oreille", color: 'var(--hw-vivid-ear)', icon: CATEGORY_ICONS[0], games: earGames },
  { title: 'La voix', color: 'var(--hw-vivid-voice)', icon: CATEGORY_ICONS[1], games: voiceGames },
  { title: 'Le solfège', color: 'var(--hw-vivid-theory)', icon: CATEGORY_ICONS[2], games: theoryGames },
  { title: 'Rythme et tempo', color: 'var(--hw-vivid-rhythm)', icon: CATEGORY_ICONS[3], games: [...rhythmGames, ...tempoGames] },
  // Écrans de mise au point, derrière un interrupteur (pas de médailles).
  ...(featureEnabled('testMicro')
    ? [{ title: 'Tests', color: 'var(--hw-vivid-theory)', tests: true, games: [{ path: '/debug/micro', icon: GAME_ICONS['lis-dis'], title: 'Test du micro' }] }]
    : []),
]
</script>

<style scoped>
h1 {
  margin: 0;
  font-family: 'Dancing Script', cursive;
  font-size: 30px;
  font-weight: 700;
  color: var(--ion-color-primary);
}
/* Défi du jour : un bandeau sombre, la note en filigrane. */
.daily {
  position: relative;
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 2px 0 4px;
  padding: 9px 14px;
  border: none;
  border-radius: 16px;
  background: var(--hw-daily, #2d3047);
  color: #fff;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(45, 48, 71, 0.2);
}
.daily-icon {
  flex: none;
  font-size: 34px;
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
  font-size: 16px;
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
  bottom: -18px;
  font-size: 64px;
  opacity: 0.08;
}
/* Titre de catégorie : la police manuscrite du titre, en violet. */
.category h2 {
  margin: 8px 0 5px;
  font-family: 'Dancing Script', cursive;
  font-size: 23px;
  line-height: 1.1;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.games {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
/* Un jeu : l'icône et son nom en haut, le bandeau blanc des parties et des médailles en bas. */
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* La même hauteur pour toutes : de quoi loger un nom sur deux lignes et le bandeau. */
  min-height: 72px;
  box-sizing: border-box;
  border-radius: 14px;
  color: #fff;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.08);
}
.card:active {
  transform: scale(0.98);
}
.disc {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--hw-surface, #fff);
}
.disc ion-icon {
  font-size: 26px;
  color: var(--hw-card-ink);
}
.head {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
}
.head strong {
  position: relative;
  z-index: 1;
  min-width: 0;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.12;
}
.category-mark {
  position: absolute;
  right: -10px;
  bottom: -12px;
  font-size: 52px;
  color: #fff;
  opacity: 0.2;
  pointer-events: none;
}
/* Le bandeau du bas : les parties à gauche, les médailles à droite, sur fond blanc pour que toutes les couleurs se voient. */
.strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 8px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
}
.strip small {
  font-size: 11px;
  line-height: 1.2;
}
.strip small b {
  font-size: 12px;
}
.dots {
  display: flex;
  align-items: center;
  gap: 4px;
}
/* Titre à gauche, Paramètres et Infos à droite, sur la même ligne. */
/* Infos en haut à gauche, Paramètres en haut à droite, logo et titre centrés entre les deux. */
.top {
  display: flex;
  align-items: center;
  margin-top: -6px;
}
.brand {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 48px;
}
.logo {
  width: 36px;
  height: 36px;
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
