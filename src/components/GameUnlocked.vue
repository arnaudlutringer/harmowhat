<template>
  <!-- Nouveau jeu débloqué, à la fin d'une partie : une annonce par-dessus l'écran de résultat. -->
  <div v-if="game" class="veil" role="dialog" aria-modal="true" :aria-label="`Nouveau jeu débloqué : ${GAMES[game].title}`">
    <div class="popin">
      <span class="label">🗝️ Nouveau jeu débloqué !</span>
      <span class="tile" :style="{ background: color }">
        <span class="face"><ion-icon :icon="GAME_ICONS[game]" aria-hidden="true" /></span>
        <span class="spark" aria-hidden="true">✨</span>
      </span>
      <strong>{{ GAMES[game].title }}</strong>
      <span class="summary">{{ summary }}</span>
      <span class="progress">{{ unlockProgress.open }} jeux sur {{ unlockProgress.total }}<template v-if="nextUnlock"> · le prochain dans {{ nextUnlock.remaining }} partie{{ nextUnlock.remaining > 1 ? 's' : '' }}</template></span>
      <button type="button" class="try" @click="emit('try', game)">L'essayer</button>
      <button type="button" class="later" @click="emit('close')">Plus tard</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { GAMES, type GameId } from '@/games/highScores'
import { GAME_ICONS } from '@/games/icons'
import { SUMMARIES } from '@/games/intros'
import { gameCategory } from '@/games/trophies'
import { nextUnlock, unlockProgress } from '@/games/unlocks'

const props = defineProps<{ game: GameId | null }>()
const emit = defineEmits<{ try: [game: GameId]; close: [] }>()

const VIVID = ['--hw-vivid-ear', '--hw-vivid-voice', '--hw-vivid-theory', '--hw-vivid-rhythm', '--hw-vivid-rhythm']
const color = computed(() => (props.game ? `var(${VIVID[gameCategory(props.game)] ?? VIVID[0]})` : ''))
const summary = computed(() => (props.game ? SUMMARIES[props.game] : ''))
</script>

<style scoped>
.veil {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(45, 48, 71, 0.55);
  animation: fade 0.25s ease-out;
}
.popin {
  width: min(100%, 330px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 22px 18px 16px;
  border-radius: 24px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: pop 0.45s ease-out;
}
.label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--ion-color-primary);
}
/* L'icône du jeu, aux couleurs de sa catégorie, qui apparaît en tournant. */
.tile {
  position: relative;
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border-radius: 30px;
  transform: rotate(-6deg);
  box-shadow: 0 12px 26px rgba(45, 48, 71, 0.25);
  animation: spin 0.6s ease-out;
}
.face {
  display: grid;
  place-items: center;
  width: 78px;
  height: 78px;
  border-radius: 22px;
  background: #fff;
}
.face ion-icon {
  font-size: 54px;
  color: var(--hw-card-ink);
}
.spark {
  position: absolute;
  top: -12px;
  right: -14px;
  font-size: 26px;
}
strong {
  margin-top: 4px;
  font-size: 24px;
}
.summary {
  font-size: 14px;
  line-height: 1.35;
  color: var(--ion-color-medium);
}
.progress {
  font-size: 12px;
  color: var(--ion-color-medium);
}
.popin button {
  width: 100%;
  border: none;
  border-radius: 18px;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
}
.try {
  margin-top: 6px;
  padding: 14px;
  background: linear-gradient(135deg, #7d6cf2, #4b3fd1);
  color: #fff;
  font-size: 16px;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 10px 22px rgba(76, 63, 209, 0.35);
}
.later {
  padding: 10px;
  background: transparent;
  color: var(--ion-color-primary);
  font-size: 14px;
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes pop {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
}
@keyframes spin {
  from {
    transform: rotate(-200deg) scale(0.3);
  }
}
</style>
