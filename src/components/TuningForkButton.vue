<template>
  <ion-button
    fill="clear"
    :class="{ ringing: playing }"
    :disabled="playing"
    aria-label="Diapason La3 440 Hz"
    title="Diapason (La3, 440 Hz)"
    @click="play"
  >
    <svg slot="icon-only" class="tuning-fork" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 2v8a4 4 0 0 0 8 0V2" />
      <path d="M12 14v8" />
    </svg>
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue'
import { playTuningFork } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'

const emit = defineEmits<{ played: [] }>()
const { playing, track } = usePlaying()

function play() {
  emit('played')
  track(playTuningFork())
}
</script>

<style scoped>
.tuning-fork {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Pendant le son : le diapason vibre et passe en couleur secondaire. */
.ringing {
  --color: var(--ion-color-secondary);
  opacity: 1;
}
.ringing .tuning-fork {
  animation: vibrate 0.12s linear infinite;
}
@keyframes vibrate {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(-4deg);
  }
  75% {
    transform: rotate(4deg);
  }
}
</style>
