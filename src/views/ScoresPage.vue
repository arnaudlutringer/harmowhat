<template>
  <ion-page>
    <ion-content>
      <!-- Bandeau du jeu, comme ses réglages ; retour à l'écran précédent (Hall of fame, fin de partie…). -->
      <game-hero :game="game" :title="info.title" back-label="Retour" @back="back">
        <p class="subtitle">🏆 Meilleurs scores</p>
      </game-hero>
      <!-- Le monde, le pays ou cet appareil : à cheval sur le bas du bandeau. -->
      <scope-tabs overlap />

      <div class="body">
        <!-- Le classement affiché : niveau et nombre de questions, en pastilles (comme les réglages). -->
        <template v-if="levels.length > 1">
          <h2>Niveau</h2>
          <div class="chips wrap" role="radiogroup" aria-label="Niveau">
            <button v-for="l in levels" :key="l.id" role="radio" :aria-checked="board.level === l.id" :class="{ on: board.level === l.id }" @click="board.level = l.id">
              {{ l.label }}
            </button>
          </div>
        </template>
        <template v-if="info.questionCounts.length > 1">
          <h2>Questions</h2>
          <div class="chips" role="radiogroup" aria-label="Nombre de questions">
            <button v-for="n in info.questionCounts" :key="n" role="radio" :aria-checked="board.questions === n" :class="{ on: board.questions === n }" @click="board.questions = n">
              {{ n }}
            </button>
          </div>
        </template>

        <!-- Monde et pays sans connexion : un message à la place du classement, rechargé dès que la connexion revient. -->
        <p v-if="needConnection" class="empty">📶 Connecte-toi à Internet pour voir le classement {{ scope === 'pays' ? 'de ton pays' : 'mondial' }}.</p>
        <p v-else-if="loading" class="empty">Chargement du classement…</p>
        <p v-else-if="failed" class="empty">Classement indisponible pour le moment : vérifie ta connexion.</p>
        <template v-else-if="entries.length">
          <!-- Podium : le deuxième à gauche, le premier au centre (plus haut), le troisième à droite. -->
          <div class="podium">
            <div v-for="i in [1, 0, 2]" :key="i" class="step" :class="[`place-${i + 1}`, { me: i === highlight, mine: isMine(entries[i]), vacant: !entries[i] }]">
              <rank-badge class="medal" :rank="i + 1" />
              <span class="name">{{ entries[i] ? withFlag(entries[i]) : '—' }}</span>
              <strong v-if="entries[i]" class="points">{{ entries[i].points.toLocaleString('fr-FR') }}</strong>
              <div class="block">{{ i + 1 }}</div>
            </div>
          </div>

          <!-- À partir du quatrième : des cartes, la mienne mise en avant. -->
          <ol v-if="entries.length > 3" class="table" start="4">
            <li v-for="(e, i) in entries.slice(3)" :key="i" :class="{ me: i + 3 === highlight, mine: isMine(e) }">
              <rank-badge :rank="i + 4" />
              <span class="name">{{ withFlag(e) }}</span>
              <strong class="points">{{ e.points.toLocaleString('fr-FR') }} <span class="pts">pts</span></strong>
            </li>
          </ol>
        </template>
        <p v-else class="empty">Pas encore de score ici. À toi de jouer !</p>
      </div>
    </ion-content>

    <!-- En bas, toujours à portée du pouce : l'accueil et une partie avec ces réglages. -->
    <ion-footer class="ion-no-border">
      <div class="actions">
        <button class="home" aria-label="Accueil" @click="home"><ion-icon :icon="homeOutline" /></button>
        <button class="start" @click="replay">
          <ion-icon :icon="GAME_ICONS[game]" aria-hidden="true" />
          Jouer
        </button>
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonContent, IonFooter, IonIcon, IonPage, onIonViewWillEnter, useIonRouter } from '@ionic/vue'
import { homeOutline } from 'ionicons/icons'
import { GAME_ICONS } from '@/games/icons'
import GameHero from '@/components/GameHero.vue'
import RankBadge from '@/components/RankBadge.vue'
import ScopeTabs from '@/components/ScopeTabs.vue'
import { GAMES, getScores, isGameId, levelLabel, parseBoard, playHref, shownLevels } from '@/games/highScores'
import { cachedBoard, fetchBoard, parseScope, scope, updateCachedBoard, worldVersion, type WorldScore } from '@/games/worldScores'
import { flag } from '@/player/countries'
import { profile } from '@/player/profile'
import { online } from '@/player/online'

interface Row {
  name: string
  points: number
  /** Pays du joueur (classements mondial et national). */
  country?: string
  /** Identifiant technique du joueur (profil Mon compte de son appareil). */
  playerId?: string
}

const fromWorld = (rows: readonly WorldScore[]): Row[] =>
  rows.map((r) => ({ name: r.name, points: r.points, country: r.country, playerId: r.player_id ?? undefined }))

const route = useRoute()
const router = useIonRouter()
const game = isGameId(route.params.game) ? route.params.game : 'grave-ou-aigu'
const info = GAMES[game]
// Le niveau Impossible n'apparaît qu'une fois débloqué.
const levels = shownLevels(game)
const board = reactive(parseBoard(game, route.query))
const initial = { ...board }
const entries = ref<Row[]>([])
const loading = ref(false)
const failed = ref(false)
scope.value = parseScope(route.query.vue) ?? scope.value

// Le score qui vient d'être enregistré est mis en avant, tant qu'on regarde son classement :
// par son rang sur l'appareil, par l'identifiant du joueur et ses points dans le monde et le pays.
const rang = Number(route.query.rang)
const myPoints = Number(route.query.pts)
const highlight = computed(() => {
  if (board.level !== initial.level || board.questions !== initial.questions) return -1
  if (scope.value === 'appareil') return Number.isInteger(rang) ? rang : -1
  return Number.isFinite(myPoints) ? entries.value.findIndex((e) => isMine(e) && e.points === myPoints) : -1
})

const withFlag = (e: Row) => (e.country ? `${flag(e.country)} ${e.name}` : e.name)

// Scores du joueur qui utilise l'appli, reconnus à son identifiant technique (et non à son nom ou son pays,
// qu'il peut changer, ou que d'autres peuvent porter) : en gras et mis en avant.
const isMine = (e?: Row) => !!e?.playerId && e.playerId === profile.value.id

// Chaque chargement remplace le précédent : une réponse arrivée trop tard (autre onglet, autre réglage) est ignorée.
let request = 0
async function load() {
  const id = ++request
  failed.value = false
  if (scope.value === 'appareil') {
    loading.value = false
    entries.value = getScores(board)
    return
  }
  // Le classement en cache (chargé au lancement) s'affiche aussitôt, puis la version à jour le remplace.
  const country = scope.value === 'pays' ? profile.value.country : undefined
  const cached = cachedBoard(board, country)
  entries.value = fromWorld(cached ?? [])
  loading.value = !cached
  try {
    const rows = await fetchBoard(board, country)
    if (id === request) entries.value = fromWorld(rows)
    updateCachedBoard(board, rows, country)
  } catch {
    // Sans connexion, le cache suffit ; sans cache, on le signale.
    if (id === request && !cached) failed.value = true
  } finally {
    if (id === request) loading.value = false
  }
}
const needConnection = computed(() => scope.value !== 'appareil' && !online.value)

// worldVersion : des scores viennent d'arriver dans la base ; online : la connexion revient (classement à jour en direct).
watch([board, scope, worldVersion, online], () => void load())
onIonViewWillEnter(() => void load())
void load()


function replay() {
  router.push(playHref(board))
}

/** Retour : l'écran d'où l'on vient (Hall of fame, fin de partie), sinon le Hall of fame. */
function back() {
  if (router.canGoBack()) router.back()
  else router.navigate('/hall-of-fame', 'back', 'replace')
}

function home() {
  router.navigate('/home', 'root', 'replace')
}
</script>

<style scoped>
.subtitle {
  margin: 4px 0 0;
  font-weight: 600;
  opacity: 0.8;
}
.body {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px 24px;
}
h2 {
  margin: 16px 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
/* Pastilles de choix, comme les réglages d'un jeu. */
.chips {
  display: flex;
  gap: 8px;
}
.chips.wrap {
  flex-wrap: wrap;
}
.chips button {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.06);
  cursor: pointer;
}
.chips .on {
  background: var(--ion-color-primary);
  color: #fff;
  box-shadow: 0 6px 14px rgba(108, 92, 231, 0.35);
}
/* Podium : marches arrondies aux couleurs des médailles. */
.podium {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin: 24px 0 16px;
}
.step {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.step .medal {
  width: 34px;
  height: 34px;
  margin-bottom: 4px;
  font-size: 16px;
}
.step .name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.step .points {
  margin: 2px 0 6px;
  color: var(--ion-color-primary);
  font-variant-numeric: tabular-nums;
}
.step .block {
  width: 100%;
  display: grid;
  place-items: center;
  border-radius: 16px 16px 0 0;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  box-shadow: 0 6px 16px rgba(45, 48, 71, 0.15);
}
.place-1 .block {
  height: 110px;
  background: linear-gradient(180deg, #f6c94a, #e9a514);
}
.place-2 .block {
  height: 80px;
  background: linear-gradient(180deg, #c3ccd8, #96a3b4);
}
.place-3 .block {
  height: 60px;
  background: linear-gradient(180deg, #e0a676, #c27a40);
}
.step.vacant {
  opacity: 0.4;
}
.step.me .block {
  outline: 3px solid var(--ion-color-primary);
  outline-offset: 2px;
}
.step.mine .name {
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--hw-button-active);
  color: var(--ion-color-primary);
  font-weight: 800;
}
/* À partir du quatrième : des cartes blanches arrondies. */
.table {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.table li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.06);
}
.table li.me,
.table li.mine {
  background: var(--hw-button-active);
  font-weight: 700;
}
.table li.mine {
  outline: 2px solid var(--ion-color-primary);
}
.table li.mine .name {
  color: var(--ion-color-primary);
}
.rank {
  width: 28px;
  text-align: center;
  color: var(--ion-color-medium);
  font-weight: 600;
}
.table .name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table .points {
  color: var(--ion-color-primary);
  font-variant-numeric: tabular-nums;
}
.empty {
  margin: 28px 0;
  text-align: center;
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
.home {
  width: 64px;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  color: var(--ion-color-primary);
  font-size: 26px;
  box-shadow: 0 4px 10px rgba(45, 48, 71, 0.1);
}
.start {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #7d6cf2, #4b3fd1);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 10px 22px rgba(76, 63, 209, 0.35);
}
.start ion-icon {
  font-size: 28px;
}
</style>