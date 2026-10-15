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

        <ol v-if="entries.length" class="table">
          <li v-for="(e, i) in entries" :key="i" :class="{ me: i === highlight }">
            <span class="rank">{{ medal(i) }}</span>
            <span class="name">{{ e.name }}</span>
            <span class="detail">{{ e.correct }}/{{ board.questions }}</span>
            <strong class="points">{{ e.points }}</strong>
          </li>
        </ol>
        <p v-else class="empty">Pas encore de score ici. À toi de jouer !</p>

        <ion-button expand="block" size="large" @click="replay">Rejouer</ion-button>
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
import { GAMES, getScores, isGameId, levelLabel, parseBoard, playHref, type ScoreEntry } from '@/games/highScores'

const route = useRoute()
const router = useIonRouter()
const game = isGameId(route.params.game) ? route.params.game : 'grave-ou-aigu'
const info = GAMES[game]
const board = reactive(parseBoard(game, route.query))
const initial = { ...board }
const entries = ref<ScoreEntry[]>([])

// Le score qui vient d'être enregistré est mis en avant, tant qu'on regarde son classement.
const rang = Number(route.query.rang)
const highlight = computed(() =>
  Number.isInteger(rang) && board.level === initial.level && board.questions === initial.questions ? rang : -1,
)

function load() {
  entries.value = getScores(board)
}
watch(board, load)
onIonViewWillEnter(load)
load()

const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`

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
.table {
  list-style: none;
  padding: 0;
  margin: 20px 0 28px;
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
  font-size: 18px;
}
.name {
  flex: 1;
}
.detail {
  color: var(--ion-color-medium);
  font-size: 14px;
}
.points {
  min-width: 56px;
  text-align: right;
  color: var(--ion-color-primary);
  font-variant-numeric: tabular-nums;
}
.empty {
  margin: 28px 0;
  text-align: center;
  color: var(--ion-color-medium);
}
ion-button + ion-button {
  margin-top: 8px;
}
</style>
