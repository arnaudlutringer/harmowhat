<template>
  <game-settings
    game="harmonies"
    title="Les harmonies"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.harmonies.settings"
    play-path="/games/harmonies/jouer"
    :parse="parseSettings"
    :next-path="nextPath"
    :extra="{ precision }"
    :board-level="(level) => `${level}-${precision}`"
  >
    <!-- La précision : intervalle seul, ou avec sa qualité (tierce mineure, quarte augmentée…). -->
    <template #extra>
      <h2 class="extra-title">Précision</h2>
      <div class="precisions" role="radiogroup" aria-label="Précision">
        <button
          v-for="(cfg, key) in PRECISIONS"
          :key="key"
          role="radio"
          :aria-checked="precision === key"
          :class="{ on: precision === key }"
          @click="precision = key"
        >
          <strong>{{ cfg.label }}</strong>
          <small>{{ cfg.description }}</small>
        </button>
      </div>
    </template>
  </game-settings>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, PRECISIONS, QUESTION_COUNTS, type Precision } from '@/games/intervals'

function savedPrecision(): Precision {
  try {
    return parseSettings(JSON.parse(localStorage.getItem('harmowhat.harmonies.settings') ?? '{}')).precision
  } catch {
    return parseSettings({}).precision
  }
}

const precision = ref<Precision>(savedPrecision())
const nextPath = ({ questions, level }: { questions: number; level: string }) =>
  `/games/harmonies/jouer?questions=${questions}&level=${level}&precision=${precision.value}`
</script>

<style scoped>
.extra-title {
  margin: 18px 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
.precisions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.precisions button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px;
  border: none;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  text-align: left;
  box-shadow: 0 2px 8px rgba(45, 48, 71, 0.07);
  cursor: pointer;
}
.precisions small {
  font-size: 11px;
  line-height: 1.3;
  color: var(--ion-color-medium);
}
.precisions .on {
  outline: 3px solid var(--ion-color-primary);
  background: var(--hw-button-active);
}
</style>