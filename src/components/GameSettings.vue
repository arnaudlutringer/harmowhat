<template>
  <ion-page>
    <ion-content>
      <!-- Bandeau aux couleurs de la catégorie : la grande icône du jeu, penchée, et son nom. -->
      <header class="hero" :style="{ '--cat': `var(${CATEGORY_VARS[gameCategory(game)] ?? CATEGORY_VARS[0]})` }">
        <ion-back-button class="back" default-href="/home" text="" />
        <span class="big"><ion-icon :icon="GAME_ICONS[game]" aria-hidden="true" /></span>
        <h1>{{ title }}</h1>
        <p class="summary">{{ SUMMARIES[game] }}</p>
        <!-- Ton parcours sur ce jeu : record du téléphone, parties terminées, meilleure médaille GOAT. -->
        <div class="stats">
          <span>🏆 <b>{{ record ? record.toLocaleString('fr-FR') : '—' }}</b> record</span>
          <span>🎮 <b>{{ plays }}</b> partie{{ plays > 1 ? 's' : '' }}</span>
          <span :class="{ off: !goat }">{{ goat ? `${TIER_LABELS[goat].medal} GOAT` : '🐐 GOAT à gagner' }}</span>
        </div>
      </header>

      <div class="tabs" role="tablist">
        <button v-for="t in TABS" :key="t.id" role="tab" :aria-selected="tab === t.id" :class="{ on: tab === t.id }" @click="tab = t.id">
          {{ t.label }}
        </button>
      </div>

      <div class="body">
        <!-- Jouer : le nombre de questions en pastilles, les niveaux en tuiles. -->
        <template v-if="tab === 'jouer'">
          <template v-if="questionCounts.length > 1">
            <h2>Questions</h2>
            <div class="chips" role="radiogroup" aria-label="Nombre de questions">
              <button v-for="n in questionCounts" :key="n" role="radio" :aria-checked="questions === n" :class="{ on: questions === n }" @click="questions = n">
                {{ n }}
              </button>
            </div>
          </template>

          <h2>Niveau</h2>
          <div class="levels" role="radiogroup" aria-label="Niveau">
            <button
              v-for="(cfg, key, i) in shownLevels"
              :key="key"
              role="radio"
              :aria-checked="level === key"
              class="level"
              :class="{ on: level === key, impossible: key === 'impossible' }"
              @click="level = String(key)"
            >
              <span class="medal" :class="{ off: !medalWon(String(key)) }" aria-hidden="true">{{ medalOf(String(key), i) }}</span>
              <strong>{{ cfg.label }}</strong>
              <small>{{ cfg.description }}</small>
              <slot name="level-extra" :level="String(key)" />
              <span class="flames" aria-hidden="true">{{ key === 'impossible' ? '💀' : '🔥'.repeat(Math.min(3, i + 1)) }}</span>
            </button>
          </div>

          <!-- Réglage propre au jeu (la précision des harmonies). -->
          <slot name="extra" />
        </template>

        <!-- Règles : la présentation du jeu et le barème. -->
        <div v-else-if="tab === 'regles'" class="rules">
          <p v-for="line in INTROS[game]" :key="line">{{ line }}</p>
          <p>
            Chaque question démarre à 10&nbsp;000 points, qui baissent jusqu'à 100 : plus tu réponds vite, plus tu en gagnes.
            Réécouter ou utiliser le diapason coûte 200 points, et une mauvaise réponse n'en rapporte aucun.
          </p>
        </div>

        <!-- Records : les meilleurs scores du téléphone pour les réglages choisis. -->
        <div v-else class="records">
          <p class="board">{{ boardLabel }}</p>
          <ol v-if="records.length">
            <li v-for="(r, i) in records" :key="i">
              <span class="rank">{{ ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.` }}</span>
              <span class="name">{{ r.name }}</span>
              <strong>{{ r.points.toLocaleString('fr-FR') }} pts</strong>
            </li>
          </ol>
          <p v-else class="empty">Pas encore de score pour ces réglages : à toi de jouer !</p>
          <ion-button fill="clear" @click="router.push(scoresHref(board))">Voir tous les classements ›</ion-button>
        </div>
      </div>
    </ion-content>

    <!-- En bas, toujours à portée du pouce : l'essai d'une question et le départ. -->
    <ion-footer class="ion-no-border">
      <div class="actions">
        <button class="trial" @click="start(true)">Un<br />essai</button>
        <button class="start" @click="start()">C'est parti&nbsp;!</button>
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { withTrial } from '@/games/ready'
import { computed, ref, watch } from 'vue'
import { IonBackButton, IonButton, IonContent, IonFooter, IonIcon, IonPage, useIonRouter } from '@ionic/vue'
import { useRoute } from 'vue-router'
import { bestScore, getScores, hasLocalScores, levelLabel, scoresHref, type Board, type GameId } from '@/games/highScores'
import { GAME_ICONS } from '@/games/icons'
import { INTROS, SUMMARIES } from '@/games/intros'
import { earnedTrophies, gameCategory, gamesPlayed, hasPlayed, TIER_LABELS, visibleLevels, type Tier } from '@/games/trophies'

/**
 * Écran de réglages d'un jeu : un bandeau à ses couleurs, trois onglets (Jouer, Règles, Records) et,
 * fixés en bas, « Un essai » et « C'est parti ! ». Nombre de questions et niveau sont mémorisés sur l'appareil.
 */
const props = defineProps<{
  title: string
  game: GameId
  levels: Record<string, { label: string; description: string }>
  questionCounts: readonly number[]
  /** Clé de stockage des derniers réglages choisis. */
  storageKey: string
  /** Écran de jeu, qui reçoit `questions` et `level` dans l'adresse. */
  playPath: string
  /** Lit des réglages enregistrés (avec repli sur les valeurs par défaut). */
  parse: (raw: { questions?: unknown; level?: unknown }) => { questions: number; level: string }
  /** Écran qui suit les réglages, s'il dépend du niveau (ex. l'écran diapason en expert) ; sinon `playPath`. */
  nextPath?: (settings: { questions: number; level: string }) => string
  /** Réglages propres au jeu, mémorisés avec les autres (la précision des harmonies). */
  extra?: Record<string, string>
  /** Niveau du classement, s'il diffère du niveau choisi (harmonies : niveau et précision). */
  boardLevel?: (level: string) => string
}>()

const CATEGORY_VARS = ['--hw-category-ear', '--hw-category-voice', '--hw-category-theory', '--hw-category-rhythm', '--hw-category-tempo']
const TABS = [
  { id: 'jouer', label: 'Jouer' },
  { id: 'regles', label: 'Règles' },
  { id: 'records', label: 'Records' },
] as const

// On repropose les derniers réglages choisis.
function loadSaved() {
  try {
    return props.parse(JSON.parse(localStorage.getItem(props.storageKey) ?? '{}'))
  } catch {
    return props.parse({})
  }
}

const saved = loadSaved()
const questions = ref<number>(saved.questions)
// Le niveau Impossible n'apparaît qu'une fois débloqué.
const shownLevels = computed(() => visibleLevels(props.game, props.levels))
const level = ref<string>(saved.level in shownLevels.value ? saved.level : 'expert')
const router = useIonRouter()

// Première visite (aucune partie terminée, aucun score) : on ouvre sur les règles ; ensuite, directement sur Jouer.
const firstTime = () => !hasPlayed(props.game) && !hasLocalScores(props.game)
const tab = ref<'jouer' | 'regles' | 'records'>(firstTime() ? 'regles' : 'jouer')
// L'écran reste en mémoire : au retour (« Changer les réglages » après une partie), on revient sur Jouer.
const route = useRoute()
const ownPath = route.path
watch(
  () => route.path,
  (path) => {
    if (path === ownPath && !firstTime()) tab.value = 'jouer'
  },
)

// Médaille GOAT de chaque niveau : allumée si le GOAT a été gagné à ce niveau ou au-dessus.
const TIERS: Tier[] = ['debutant', 'normal', 'expert', 'impossible']
const tierOf = (key: string, index: number): Tier => (TIERS.includes(key as Tier) ? (key as Tier) : TIERS[Math.min(index, 2)])
const keys = computed(() => Object.keys(shownLevels.value))
const medalOf = (key: string, index: number) => TIER_LABELS[tierOf(key, index)].medal
function medalWon(key: string) {
  const best = earnedTrophies.value[`goat-${props.game}`]?.tier
  return !!best && TIERS.indexOf(best) >= TIERS.indexOf(tierOf(key, keys.value.indexOf(key)))
}

// Bandeau : recalculé à chaque retour sur l'écran (après une partie).
const refresh = ref(0)
watch(() => route.path, (path) => path === ownPath && refresh.value++)
const record = computed(() => (refresh.value, bestScore(props.game)))
const plays = computed(() => (refresh.value, gamesPlayed(props.game)))
const goat = computed(() => earnedTrophies.value[`goat-${props.game}`]?.tier)

const board = computed<Board>(() => ({ game: props.game, level: props.boardLevel?.(level.value) ?? level.value, questions: questions.value }))
const boardLabel = computed(() => `${levelLabel(board.value)}${props.questionCounts.length > 1 ? ` · ${questions.value} questions` : ''}`)
const records = computed(() => getScores(board.value).slice(0, 5))

function start(trial = false) {
  const settings = { questions: questions.value, level: level.value }
  try {
    localStorage.setItem(props.storageKey, JSON.stringify({ ...settings, ...props.extra }))
  } catch {
    // Stockage indisponible : on joue quand même.
  }
  router.push(withTrial(props.nextPath?.(settings) ?? `${props.playPath}?questions=${settings.questions}&level=${settings.level}`, trial))
}
</script>

<style scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: calc(56px + var(--ion-safe-area-top, 0px)) 16px 34px;
  background:
    radial-gradient(circle at 75% 20%, rgba(255, 255, 255, 0.45), transparent 55%),
    var(--cat);
  color: var(--hw-card-ink);
}
.back {
  position: absolute;
  top: calc(12px + var(--ion-safe-area-top, 0px));
  left: 12px;
  --color: var(--ion-color-primary);
  --background: var(--hw-surface, #fff);
  --border-radius: 50%;
  width: 40px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(45, 48, 71, 0.15);
  border-radius: 50%;
}
.big {
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border-radius: 30px;
  background: var(--hw-surface, #fff);
  transform: rotate(-6deg);
  box-shadow: 0 12px 28px rgba(45, 48, 71, 0.18);
}
.big ion-icon {
  font-size: 68px;
  color: var(--hw-card-ink);
}
h1 {
  margin: 14px 0 0;
  font-size: 26px;
  font-weight: 700;
}
.summary {
  max-width: 400px;
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  opacity: 0.8;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
}
.stats span {
  padding: 5px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}
.stats b {
  font-size: 14px;
}
.stats .off {
  opacity: 0.7;
}
.tabs {
  position: relative;
  display: flex;
  max-width: 448px;
  margin: -20px 16px 0;
  padding: 4px;
  border-radius: 16px;
  background: var(--hw-surface, #fff);
  box-shadow: 0 6px 16px rgba(45, 48, 71, 0.1);
}
@media (min-width: 480px) {
  .tabs {
    margin: -20px auto 0;
  }
}
.tabs button {
  flex: 1;
  padding: 9px 0;
  border: none;
  border-radius: 12px;
  background: none;
  color: var(--ion-color-medium);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.tabs .on {
  background: var(--hw-button-active);
  color: var(--ion-color-primary);
}
.body {
  max-width: 480px;
  margin: 0 auto;
  padding: 4px 16px 24px;
}
h2 {
  margin: 18px 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
.chips {
  display: flex;
  gap: 8px;
}
.chips button {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.06);
  cursor: pointer;
}
.chips .on {
  background: var(--ion-color-primary);
  color: #fff;
  box-shadow: 0 6px 14px rgba(108, 92, 231, 0.35);
}
/* Niveaux : des tuiles en 2 colonnes, la médaille GOAT en haut à droite, des flammes pour la difficulté. */
.levels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.level {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px;
  border: none;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  text-align: left;
  box-shadow: 0 2px 8px rgba(45, 48, 71, 0.07);
  cursor: pointer;
}
.level strong {
  font-size: 16px;
  padding-right: 22px;
}
.level small {
  font-size: 11px;
  line-height: 1.3;
  color: var(--ion-color-medium);
}
.level .medal {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 18px;
}
.level .medal.off {
  filter: grayscale(1);
  opacity: 0.3;
}
.level .flames {
  margin-top: auto;
  padding-top: 4px;
  font-size: 12px;
}
.level.on {
  outline: 3px solid var(--ion-color-primary);
  background: var(--hw-button-active);
}
/* Impossible : une tuile sombre, à part. */
.level.impossible {
  background: linear-gradient(135deg, #2d3047, #4b3fd1);
  color: #fff;
}
.level.impossible small {
  color: #cfc9f5;
}
.level.impossible.on {
  outline-color: #f2c94c;
}
.rules p {
  margin: 14px 0 0;
  line-height: 1.5;
  font-size: 15px;
}
.records .board {
  margin: 16px 0 8px;
  font-weight: 600;
  color: var(--ion-color-medium);
}
.records ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.records li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
}
.records .rank {
  width: 26px;
  text-align: center;
}
.records .name {
  flex: 1;
}
.records .empty {
  color: var(--ion-color-medium);
}
.actions {
  display: flex;
  gap: 10px;
  max-width: 480px;
  margin: 0 auto;
  padding: 10px 16px calc(12px + var(--ion-safe-area-bottom, 0px));
  background: var(--ion-background-color);
}
.actions button {
  border: none;
  font-family: inherit;
  cursor: pointer;
}
.trial {
  width: 64px;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  color: var(--ion-color-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.15;
  box-shadow: 0 4px 10px rgba(45, 48, 71, 0.1);
}
.start {
  flex: 1;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #7d6cf2, #4b3fd1);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 10px 22px rgba(76, 63, 209, 0.35);
}
</style>
