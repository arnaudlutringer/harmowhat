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
      <div class="precision-row">
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
        </button>
      </div>
      </div>
      <p class="precision-desc"><b>{{ PRECISIONS[precision].label }} :</b> {{ PRECISIONS[precision].description }}</p>
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
  align-items: center;
  min-height: 46px;
  padding: 0 12px;
  border: none;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  text-align: left;
  box-shadow: 0 2px 8px rgba(45, 48, 71, 0.07);
  cursor: pointer;
}
.precisions strong {
  font-size: 16px;
}
.precision-desc {
  margin: 8px 2px 0;
  font-size: 13px;
  line-height: 1.35;
  color: var(--ion-color-medium);
}
.precision-desc b {
  color: var(--ion-text-color);
}
/* Petit écran (Samsung A10) : « Précision » à gauche de ses deux tuiles, et sa description sur une ligne. */
@media (max-height: 740px) {
  .precision-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }
  .precision-row .extra-title {
    flex: none;
    width: 86px;
    margin: 0;
  }
  .precision-row .precisions {
    flex: 1;
    gap: 8px;
  }
  .precisions button {
    min-height: 42px;
  }
  .precision-desc {
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.precisions .on {
  outline: 3px solid var(--ion-color-primary);
  background: var(--hw-button-active);
}
</style>