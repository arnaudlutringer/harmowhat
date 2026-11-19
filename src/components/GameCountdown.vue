<template>
  <!-- Décompte avant la première question : le jeu (icône aux couleurs de sa catégorie, nom), le niveau et le nombre de
       questions, puis « Prêt ? » et le grand chiffre ; en bas, le record (ou le score à battre d'un match reçu). -->
  <div class="countdown" :style="{ '--game': color }" aria-live="assertive">
    <span v-if="trial" class="ribbon trial">Essai</span>
    <span v-else-if="match" class="ribbon">⚔️ {{ match.received ? 'Match reçu' : 'Match' }}</span>
    <span v-else-if="challenge" class="ribbon">📅 Défi du jour</span>

    <span class="mark" aria-hidden="true"><ion-icon :icon="GAME_ICONS[board.game]" /></span>

    <div class="game">
      <span class="tile" aria-hidden="true"><ion-icon :icon="GAME_ICONS[board.game]" /></span>
      <strong>{{ GAMES[board.game].title }}</strong>
      <span class="settings">
        <medal-dot v-if="medal" :kind="medal" :size="12" label="" aria-hidden="true" />
        {{ levelLabel(board) }}<template v-if="showQuestions"> · {{ board.questions }} questions</template>
      </span>
    </div>

    <div class="count-zone">
      <p>Prêt ?</p>
      <span :key="count" class="count">{{ count }}</span>
    </div>

    <div class="panel">
      <template v-if="match?.received">
        <small>Score à battre</small>
        <b>{{ match.score !== undefined ? match.score.toLocaleString('fr-FR') : '…' }}</b>
        <span v-if="match.from">{{ match.from }} · {{ levelLabel(board) }}</span>
      </template>
      <template v-else-if="match">
        <span class="note">Ton score sera envoyé à ton adversaire</span>
      </template>
      <template v-else-if="best !== null">
        <small>Ton record</small>
        <b>{{ best.toLocaleString('fr-FR') }}</b>
      </template>
      <span v-else class="note">Premier essai : à toi de poser un record&nbsp;!</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import MedalDot, { type MedalKind } from './MedalDot.vue'
import { GAMES, getScores, levelLabel, type Board } from '@/games/highScores'
import { GAME_ICONS } from '@/games/icons'
import { gameCategory } from '@/games/trophies'
import { isTodaysChallenge } from '@/games/dailyChallenge'
import { fetchMatch, parseCode } from '@/games/matches'
import { seedFromQuery } from '@/games/seed'

const props = defineProps<{ board: Board; count: number; trial?: boolean; showQuestions?: boolean }>()

const VIVID = ['--hw-vivid-ear', '--hw-vivid-voice', '--hw-vivid-theory', '--hw-vivid-rhythm', '--hw-vivid-rhythm']
const color = computed(() => `var(${VIVID[gameCategory(props.board.game)] ?? VIVID[0]})`)

/** Médaille du niveau joué (bronze, argent, or, couronne), quand le niveau en a une. */
const medal = computed<MedalKind | undefined>(() => {
  const tier = props.board.level.split('-')[0]
  const kind = tier === 'intermediaire' ? 'normal' : tier
  return ['debutant', 'normal', 'expert', 'impossible'].includes(kind) ? (kind as MedalKind) : undefined
})

/** Meilleur score du téléphone sur ces réglages, s'il y en a un. */
const best = computed(() => {
  const scores = getScores(props.board)
  return scores.length ? Math.max(...scores.map((s) => s.points)) : null
})

const route = useRoute()
const seeded = seedFromQuery(route.query) !== undefined
const code = parseCode(String(route.query.match ?? ''))
/** Défi du jour (pas pendant un match, qui a ses propres questions). */
const challenge = computed(() => !seeded && isTodaysChallenge(props.board))
/** Match reçu (« match=CODE ») : le score à battre et son auteur, lus en ligne ; match lancé (« defi=1 »). */
const match = ref<{ received: boolean; from?: string; score?: number } | null>(
  seeded && code ? { received: true } : seeded && route.query.defi === '1' ? { received: false } : null,
)
onMounted(async () => {
  if (!match.value?.received || !code) return
  try {
    const m = await fetchMatch(code)
    if (m) match.value = { received: true, from: m.creator_name, score: m.creator_points }
  } catch {
    // Hors ligne : le décompte s'affiche sans le score à battre.
  }
})
</script>

<style scoped>
.countdown {
  position: relative;
  min-height: calc(100vh - 2 * var(--ion-padding, 16px) - var(--ion-safe-area-top, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 50px 0 12px;
  box-sizing: border-box;
  overflow: hidden;
  text-align: center;
}
/* Le ruban du haut : défi du jour, match, ou essai. */
.ribbon {
  position: absolute;
  top: 0;
  padding: 6px 16px;
  border-radius: 99px;
  background: var(--game);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.ribbon.trial {
  background: var(--ion-color-danger);
}
/* L'icône du jeu en filigrane, sur la droite. */
.mark {
  position: absolute;
  right: -130px;
  top: 150px;
  font-size: 300px;
  color: var(--game);
  opacity: 0.06;
  pointer-events: none;
}
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.tile {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  border-radius: 20px;
  background: var(--game);
  color: #fff;
  font-size: 40px;
  box-shadow: 0 8px 18px rgba(45, 48, 71, 0.18);
}
.game strong {
  font-size: 26px;
}
.settings {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  color: var(--ion-color-medium);
}
.count-zone p {
  margin: 0;
  font-size: 22px;
  color: var(--ion-color-medium);
}
.count {
  display: block;
  font-size: 160px;
  font-weight: 800;
  line-height: 1;
  color: var(--game);
  animation: pop 1s ease-out;
}
@keyframes pop {
  0% {
    transform: scale(1.6);
    opacity: 0;
  }
  25% {
    transform: scale(1);
    opacity: 1;
  }
}
/* En bas : le record, ou le score à battre. */
.panel {
  width: min(100%, 360px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-radius: 20px;
  background: var(--hw-surface, #fff);
  box-shadow: 0 6px 16px rgba(45, 48, 71, 0.1);
  box-sizing: border-box;
}
.panel small {
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
.panel b {
  font-size: 30px;
  color: var(--game);
}
.panel span {
  color: var(--ion-color-medium);
}
.panel .note {
  font-size: 15px;
}
/* Petit écran (Samsung A10) : un peu moins grand pour tout faire tenir. */
@media (max-height: 740px) {
  .countdown {
    padding-top: 44px;
    gap: 10px;
  }
  .tile {
    width: 58px;
    height: 58px;
    font-size: 32px;
  }
  .game strong {
    font-size: 22px;
  }
  .count {
    font-size: 130px;
  }
  .panel b {
    font-size: 26px;
  }
}
</style>
