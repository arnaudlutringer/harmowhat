<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Hall of fame" back-href="/home" />

      <div class="hall">
        <p class="hint">Les meilleurs scores de chaque jeu, par niveau et par nombre de questions.</p>
        <scope-tabs />
        <p v-if="failed" class="hint">Classement indisponible pour le moment : vérifie ta connexion.</p>
        <ion-list lines="full">
          <ion-item v-for="g in games" :key="g.id" button detail :router-link="`${scoresHref(g.board)}&vue=${scope}`">
            <ion-label>
              <strong>{{ g.title }}</strong>
              <!-- Record du jeu : médaille d'or, (drapeau,) nom du premier et ses points. -->
              <p v-if="loading">…</p>
              <p v-else-if="g.best" class="record">
                <span aria-hidden="true">🥇</span> {{ g.best.country ? `${flag(g.best.country)} ` : '' }}{{ g.best.name }} : {{ g.best.points }} pts
              </p>
              <p v-else>Pas encore de score</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonContent, IonItem, IonLabel, IonList, IonPage, onIonViewWillEnter } from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import ScopeTabs from '@/components/ScopeTabs.vue'
import { GAMES, getScores, parseBoard, scoresHref, type Board, type GameId } from '@/games/highScores'
import { cachedRecord, fetchRecord, scope, type WorldRecord } from '@/games/worldScores'
import { flag } from '@/player/countries'
import { profile } from '@/player/profile'

interface Best {
  name: string
  points: number
  country?: string
}

interface GameRow {
  id: GameId
  title: string
  /** Classement ouvert : celui du record, sinon le classement par défaut. */
  board: Board
  /** Meilleur score, tous niveaux et nombres de questions confondus. */
  best?: Best
}

const ids = Object.keys(GAMES) as GameId[]

/** Records de l'appareil. */
function deviceRows(): GameRow[] {
  return ids.map((id) => {
    const info = GAMES[id]
    const row: GameRow = { id, title: info.title, board: parseBoard(id, {}) }
    for (const l of info.levels) {
      for (const questions of info.questionCounts) {
        const board = { game: id, level: l.id, questions }
        const top = getScores(board)[0]
        if (top && (!row.best || top.points > row.best.points)) Object.assign(row, { best: top, board })
      }
    }
    return row
  })
}

function rowsOf(records: readonly (WorldRecord | undefined)[]): GameRow[] {
  return ids.map((id, i) => {
    const r = records[i]
    const board = r ? { game: id, level: r.level, questions: r.questions } : parseBoard(id, {})
    return { id, title: GAMES[id].title, board, best: r && { name: r.name, points: r.points, country: r.country } }
  })
}

/** Records du monde ou du pays du joueur, d'après le cache chargé au lancement (undefined s'il n'est pas chargé). */
function cachedRows(country?: string): GameRow[] | undefined {
  const cached = ids.map((id) => cachedRecord(id, country))
  return cached.every((c) => c) ? rowsOf(cached.map((c) => c?.record)) : undefined
}

/** Records du monde ou du pays du joueur, à jour depuis la base. */
async function worldRows(country?: string): Promise<GameRow[]> {
  return rowsOf(await Promise.all(ids.map((id) => fetchRecord(id, country))))
}

const games = ref<GameRow[]>(deviceRows())
const loading = ref(false)
const failed = ref(false)

let request = 0
async function load() {
  const id = ++request
  failed.value = false
  if (scope.value === 'appareil') {
    loading.value = false
    games.value = deviceRows()
    return
  }
  // Les records en cache (chargés au lancement) s'affichent aussitôt, puis la version à jour les remplace.
  const country = scope.value === 'pays' ? profile.value.country : undefined
  const cached = cachedRows(country)
  if (cached) games.value = cached
  loading.value = !cached
  try {
    const rows = await worldRows(country)
    if (id === request) games.value = rows
  } catch {
    // Sans connexion, le cache suffit ; sans cache, on le signale.
    if (id === request && !cached) {
      games.value = ids.map((g) => ({ id: g, title: GAMES[g].title, board: parseBoard(g, {}) }))
      failed.value = true
    }
  } finally {
    if (id === request) loading.value = false
  }
}
watch(scope, () => void load())
onIonViewWillEnter(() => void load())
void load()
</script>

<style scoped>
.hall {
  max-width: 480px;
  margin: 0 auto;
}
.hint,
ion-label p {
  color: var(--ion-color-medium);
}
</style>
