<template>
  <!-- Pas de barre d'en-tête : une flèche de retour et le titre, en haut du contenu ; pour un jeu, son icône à droite du titre. -->
  <div class="page-nav">
    <ion-back-button :default-href="backHref" text="" />
    <h1>{{ title }}</h1>
    <ion-icon v-if="game" class="icon" :icon="GAME_ICONS[game]" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { IonBackButton, IonIcon } from '@ionic/vue'
import type { GameId } from '@/games/highScores'
import { GAME_ICONS } from '@/games/icons'

defineProps<{
  title: string
  /** Écran affiché par la flèche si l'historique est vide. */
  backHref: string
  /** Jeu dont c'est l'écran, pour afficher son icône. */
  game?: GameId
}>()
</script>

<style scoped>
.page-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 480px;
  margin: 0 auto;
}
ion-back-button {
  display: block;
  --color: var(--ion-color-primary);
  margin-left: -12px;
}
h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
/* Icône du jeu, poussée contre le bord droit de l'en-tête. */
.icon {
  margin-left: auto;
  font-size: 24px;
  color: var(--hw-card-ink);
}
</style>
