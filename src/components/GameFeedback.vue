<template>
  <!-- Message après une réponse : juste ou faux, l'explication, puis la suite (barre, « J'ai compris » ou glisser). -->
  <div class="feedback" :class="[quiz.feedback.value?.correct ? 'ok' : 'ko', { reserved: reserve }]" aria-live="polite">
    <template v-if="quiz.feedback.value">
      <strong v-if="endless">{{ quiz.feedback.value.correct ? 'Palier tenu !' : 'Perdu !' }}</strong>
      <strong v-else>{{ quiz.feedback.value.correct ? 'Bonne réponse !' : 'Mauvaise réponse' }}</strong>
      <span>{{ quiz.feedback.value.message }}</span>
      <!-- Passage automatique : une barre se remplit jusqu'à la question suivante. -->
      <!-- Essai : pas de question suivante, on revient aux réglages quand on a compris. -->
      <ion-button v-if="quiz.trial" class="understood" @click="emit('understood')">J'ai compris</ion-button>
      <span
        v-else-if="advanceBar"
        :key="quiz.number.value"
        class="advance-bar"
        :style="{ animationDuration: `${advanceBar}ms` }"
        aria-hidden="true"
      />
      <button v-if="swipeToNext && !quiz.trial" class="next-hint" @click="quiz.next()">
        Glisse vers la gauche pour {{ quiz.number.value < quiz.total ? 'la question suivante' : 'voir ton score' }} ›
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue'
import type { useQuiz } from '@/composables/useQuiz'

defineProps<{
  quiz: ReturnType<typeof useQuiz<unknown>>
  endless?: boolean
  advanceBar?: number
  swipeToNext?: boolean
  /** Garder la place du message avant la réponse : rien ne bouge à l'écran quand il apparaît. */
  reserve?: boolean
}>()
const emit = defineEmits<{ understood: [] }>()
</script>

<style scoped>
.feedback {
  min-height: 64px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 18px;
  text-align: center;
}
/* Pas de place réservée au message tant qu'on n'a pas répondu : le bas de l'écran (ex. Valider) reste visible. */
.feedback:empty:not(.reserved) {
  min-height: 0;
  margin-top: 0;
}
/* Place réservée : la hauteur d'un message de deux lignes et de la ligne « Glisse vers la gauche ». */
.feedback.reserved {
  min-height: 120px;
}
.feedback.ok strong {
  color: var(--ion-color-success);
}
.feedback.ko strong {
  color: var(--ion-color-danger);
}
.understood {
  margin-top: 12px;
  --border-radius: 0;
  font-weight: 700;
}
.advance-bar {
  position: relative;
  overflow: hidden;
  width: 160px;
  height: 4px;
  margin-top: 10px;
  border-radius: 2px;
  background: rgba(108, 92, 231, 0.18);
}
.advance-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--ion-color-primary);
  transform-origin: left;
  transform: scaleX(0);
  animation: advance linear forwards;
  animation-duration: inherit;
}
@keyframes advance {
  to {
    transform: scaleX(1);
  }
}
.next-hint {
  margin-top: 12px;
  background: none;
  border: none;
  color: var(--ion-color-medium);
  font-size: 14px;
  cursor: pointer;
}
</style>
