<template>
  <!-- Tempo de départ de « Un essai » : celui du niveau, ou rapide pour s'entraîner à enchaîner les notes. -->
  <h2 class="title">Tempo de l'essai</h2>
  <div class="chips" role="radiogroup" aria-label="Tempo de l'essai">
    <button role="radio" :aria-checked="!fast" :class="{ on: !fast }" @click="fast = false">Celui du niveau</button>
    <button role="radio" :aria-checked="fast" :class="{ on: fast }" @click="fast = true">Rapide (♩ = {{ FAST_TRIAL_TEMPO }})</button>
  </div>
  <p class="hint">Seulement pour « Un essai » ; ne compte ni pour les records ni pour les trophées.</p>
</template>

<script setup lang="ts">
import { FAST_TRIAL_TEMPO } from '@/games/sightReading'

const fast = defineModel<boolean>({ default: false })
</script>

<style scoped>
/* Même présentation que les pastilles de l'écran de réglages. */
.title {
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
  padding: 10px 4px;
  border: none;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.06);
}
.chips .on {
  background: var(--ion-color-primary);
  color: #fff;
  box-shadow: 0 6px 14px rgba(108, 92, 231, 0.35);
}
.hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--ion-color-medium);
}
</style>
