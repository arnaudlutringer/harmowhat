<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Hall of fame" back-href="/home" />

      <div class="hall">
        <p class="hint">Les meilleurs scores de chaque jeu, par niveau et par nombre de questions.</p>
        <ion-list lines="full">
          <ion-item v-for="g in games" :key="g.id" button detail :router-link="scoresHref(g.board)">
            <ion-label>
              <strong>{{ g.title }}</strong>
              <p v-if="g.best">Record : {{ g.best.points }} pts par {{ g.best.name }}</p>
              <p v-else>Pas encore de score</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonContent, IonItem, IonLabel, IonList, IonPage, onIonViewWillEnter } from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import { GAMES, getScores, parseBoard, scoresHref, type Board, type GameId, type ScoreEntry } from '@/games/highScores'

interface GameRow {
  id: GameId
  title: string
  /** Classement ouvert : celui du record, sinon le classement par défaut. */
  board: Board
  /** Meilleur score, tous niveaux et nombres de questions confondus. */
  best?: ScoreEntry
}

function rows(): GameRow[] {
  return (Object.keys(GAMES) as GameId[]).map((id) => {
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

const games = ref(rows())
onIonViewWillEnter(() => (games.value = rows()))
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
