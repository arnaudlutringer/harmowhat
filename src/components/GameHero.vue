<template>
  <!-- Bandeau aux couleurs de la catégorie du jeu : la grande icône, penchée, et le titre ; le reste vient du slot. -->
  <header class="hero" :style="{ '--cat': `var(${CATEGORY_VARS[gameCategory(game)] ?? CATEGORY_VARS[0]})` }">
    <button class="back" :aria-label="backLabel" @click="emit('back')">
      <ion-icon :icon="arrowBack" aria-hidden="true" />
    </button>
    <span class="big"><ion-icon :icon="GAME_ICONS[game]" aria-hidden="true" /></span>
    <h1>{{ title }}</h1>
    <slot />
    <!-- Le symbole de la catégorie, en grand et très discret, coupé par le coin bas droit (comme la note du défi du jour). -->
    <ion-icon class="category-mark" :icon="CATEGORY_ICONS[gameCategory(game)] ?? CATEGORY_ICONS[0]" aria-hidden="true" />
  </header>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { arrowBack } from 'ionicons/icons'
import type { GameId } from '@/games/highScores'
import { GAME_ICONS } from '@/games/icons'
import { gameCategory } from '@/games/trophies'
import { CATEGORY_ICONS } from '@/games/categoryIcons'

withDefaults(defineProps<{ game: GameId; title: string; backLabel?: string }>(), { backLabel: 'Retour' })
const emit = defineEmits<{ back: [] }>()

// Les couleurs vives des tuiles de l'accueil (le rythme et le tempo y partagent la même).
const CATEGORY_VARS = ['--hw-vivid-ear', '--hw-vivid-voice', '--hw-vivid-theory', '--hw-vivid-rhythm', '--hw-vivid-rhythm']
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: calc(56px + var(--ion-safe-area-top, 0px)) 16px 34px;
  background:
    radial-gradient(circle at 75% 20%, rgba(255, 255, 255, 0.16), transparent 55%),
    var(--cat);
  color: #fff;
}
.back {
  position: absolute;
  top: calc(12px + var(--ion-safe-area-top, 0px));
  left: 12px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  padding: 0;
  color: var(--ion-color-primary);
  background: var(--hw-surface, #fff);
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(45, 48, 71, 0.15);
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
.category-mark {
  position: absolute;
  right: -22px;
  bottom: -30px;
  font-size: 130px;
  color: #fff;
  opacity: 0.14;
  pointer-events: none;
}
h1 {
  margin: 14px 0 0;
  font-size: 26px;
  font-weight: 700;
}
</style>
