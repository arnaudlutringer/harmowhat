<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Meilleurs scores" back-href="/hall-of-fame" />

      <div class="scores hw-square">
        <!-- Rappel du classement affiché : jeu, niveau, nombre de questions (modifiables). -->
        <h2>{{ info.title }}</h2>
        <p class="board">{{ levelLabel(board) }} · {{ board.questions }} questions</p>

        <ion-select
          v-if="info.levels.length > 1"
          v-model="board.level"
          label="Niveau"
          interface="popover"
          fill="outline"
          class="level"
        >
          <ion-select-option v-for="l in info.levels" :key="l.id" :value="l.id">{{ l.label }}</ion-select-option>
        </ion-select>
        <ion-segment v-if="info.questionCounts.length > 1" v-model="board.questions">
          <ion-segment-button v-for="n in info.questionCounts" :key="n" :value="n">
            <ion-label>{{ n }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <scope-tabs />

        <p v-if="loading" class="empty">Chargement du classement…</p>
        <p v-else-if="failed" class="empty">Classement indisponible pour le moment : vérifie ta connexion.</p>
        <template v-else-if="entries.length">
          <!-- Podium : le deuxième à gauche, le premier au centre (plus haut), le troisième à droite. -->
          <div class="podium">
            <div v-for="i in [1, 0, 2]" :key="i" class="step" :class="[`place-${i + 1}`, { me: i === highlight, vacant: !entries[i] }]">
              <span class="medal" aria-hidden="true">{{ MEDALS[i] }}</span>
              <span class="name">{{ entries[i] ? withFlag(entries[i]) : '—' }}</span>
              <strong v-if="entries[i]" class="points">{{ entries[i].points }} pts.</strong>
              <div class="block">{{ i + 1 }}</div>
            </div>
          </div>

          <!-- À partir du quatrième : un tableau. -->
          <ol v-if="entries.length > 3" class="table" start="4">
            <li v-for="(e, i) in entries.slice(3)" :key="i" :class="{ me: i + 3 === highlight }">
              <span class="rank">{{ i + 4 }}</span>
              <span class="name">{{ withFlag(e) }}</span>
              <strong class="points">{{ e.points }} pts.</strong>
            </li>
          </ol>
        </template>
        <p v-else class="empty">Pas encore de score ici. À toi de jouer !</p>

        <ion-button expand="block" size="large" @click="replay">
          <span class="game-emoji" aria-hidden="true">{{ info.emoji }}</span>
          Jouer
        </ion-button>
        <ion-button expand="block" fill="outline" @click="home">Accueil</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonButton, IonContent, IonLabel, IonPage, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, onIonViewWillEnter, useIonRouter,
} from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import ScopeTabs from '@/components/ScopeTabs.vue'
import { GAMES, getScores, isGameId, levelLabel, parseBoard, playHref } from '@/games/highScores'
import { fetchBoard, parseScope, scope } from '@/games/worldScores'
import { flag } from '@/player/countries'
import { profile } from '@/player/profile'

interface Row {
  name: string
  points: number
  /** Pays du joueur (classements mondial et national). */
  country?: string
}

const route = useRoute()
const router = useIonRouter()
const game = isGameId(route.params.game) ? route.params.game : 'grave-ou-aigu'
const info = GAMES[game]
const board = reactive(parseBoard(game, route.query))
const initial = { ...board }
const entries = ref<Row[]>([])
const loading = ref(false)
const failed = ref(false)
scope.value = parseScope(route.query.vue) ?? scope.value

// Le score qui vient d'être enregistré est mis en avant, tant qu'on regarde son classement :
// par son rang sur l'appareil, par son nom et ses points dans le monde et le pays.
const rang = Number(route.query.rang)
const myName = typeof route.query.nom === 'string' ? route.query.nom : ''
const myPoints = Number(route.query.pts)
const highlight = computed(() => {
  if (board.level !== initial.level || board.questions !== initial.questions) return -1
  if (scope.value === 'appareil') return Number.isInteger(rang) ? rang : -1
  return entries.value.findIndex((e) => e.name === myName && e.points === myPoints)
})

const withFlag = (e: Row) => (e.country ? `${flag(e.country)} ${e.name}` : e.name)

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
  loading.value = true
  try {
    const rows = await fetchBoard(board, scope.value === 'pays' ? profile.value.country : undefined)
    if (id === request) entries.value = rows
  } catch {
    if (id === request) {
      entries.value = []
      failed.value = true
    }
  } finally {
    if (id === request) loading.value = false
  }
}
watch([board, scope], () => void load())
onIonViewWillEnter(() => void load())
void load()

const MEDALS = ['🥇', '🥈', '🥉']

function replay() {
  router.push(playHref(board))
}

function home() {
  router.navigate('/home', 'root', 'replace')
}
</script>

<style scoped>
.scores {
  max-width: 480px;
  margin: 0 auto;
}
h2 {
  margin: 20px 0 2px;
  font-size: 20px;
}
.board {
  margin: 0 0 16px;
  color: var(--ion-color-medium);
}
.level {
  margin-bottom: 12px;
}
.podium {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin: 28px 0 24px;
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
  font-size: 30px;
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
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  box-shadow: 0 6px 16px rgba(45, 48, 71, 0.15);
}
/* Or au centre, plus haut ; argent à gauche ; bronze à droite. */
.place-1 .block {
  height: 110px;
  background: #f0b429;
}
.place-2 .block {
  height: 80px;
  background: #a0aec0;
}
.place-3 .block {
  height: 60px;
  background: #cd8a4f;
}
.step.vacant {
  opacity: 0.4;
}
.step.me .name {
  color: var(--ion-color-primary);
}
.step.me .block {
  outline: 3px solid var(--ion-color-primary);
  outline-offset: 2px;
}
.table {
  list-style: none;
  padding: 0;
  margin: -8px 0 28px;
}
.table li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--ion-text-color-rgb), 0.08);
}
.table li.me {
  background: var(--hw-button-active);
  font-weight: 700;
}
.rank {
  width: 28px;
  text-align: center;
  color: var(--ion-color-medium);
  font-weight: 600;
}
.table .name {
  flex: 1;
}
.table .points {
  min-width: 72px;
  text-align: right;
  color: var(--ion-color-primary);
  font-variant-numeric: tabular-nums;
}
.empty {
  margin: 28px 0;
  text-align: center;
  color: var(--ion-color-medium);
}
.game-emoji {
  margin-right: 10px;
  font-size: 22px;
}
ion-button + ion-button {
  margin-top: 8px;
}
</style>
