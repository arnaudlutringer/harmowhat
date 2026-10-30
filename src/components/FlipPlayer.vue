<template>
  <!-- Bouton de lecture qui se retourne à la réponse pour montrer les notes sur une portée. -->
  <div class="card" :class="{ flipped: revealed, sounding: quiz.playing.value, correct: quiz.feedback.value?.correct }">
    <div class="card-inner">
      <button
        class="face front play"
        :class="{ 'is-playing': quiz.playing.value }"
        :aria-label="`Écouter ${what}`"
        :tabindex="revealed ? -1 : 0"
        @click="quiz.listen()"
      >
        <ion-icon :icon="quiz.playing.value ? volumeHigh : play" />
      </button>
      <button class="face back" :aria-label="`Réécouter ${what}`" :tabindex="revealed ? 0 : -1" @click="quiz.listen()">
        <slot v-if="revealed" />
      </button>
    </div>
  </div>
  <p class="hint">
    {{ quiz.playing.value ? 'Écoute…' : revealed ? `Touche la portée pour réécouter ${what}` : !quiz.hasListened.value ? 'Lecture…' : quiz.replayCosts.value ? `Réécouter (−${quiz.replayPenalty} pts)` : ' ' }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { play, volumeHigh } from 'ionicons/icons'
import type { useQuiz } from '@/composables/useQuiz'

const props = defineProps<{ quiz: ReturnType<typeof useQuiz<unknown>>; what: string }>()
const revealed = computed(() => props.quiz.feedback.value !== null)
</script>

<style scoped>
.card {
  width: 240px;
  height: 160px;
  perspective: 800px;
}
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.card.flipped .card-inner {
  transform: rotateY(180deg);
}
.face {
  position: absolute;
  inset: 0;
  margin: auto;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border: none;
  cursor: pointer;
}
.front {
  width: 140px;
  height: 140px;
  font-size: 64px;
  display: grid;
  place-items: center;
}
.back {
  transition: box-shadow 0.2s;
  background: #fffdf3;
  color: #222;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transform: rotateY(180deg);
  padding: 4px;
}
.card.sounding .back {
  box-shadow: 0 0 0 4px var(--ion-color-secondary), 0 8px 24px rgba(0, 0, 0, 0.2);
}
/* Bonne réponse : la portée est entourée de vert (aussi pendant la réécoute), pas de rouge. */
.card.correct .back {
  box-shadow: 0 0 0 4px var(--ion-color-success), 0 8px 24px rgba(0, 0, 0, 0.2);
}
.hint {
  color: var(--ion-color-medium);
  margin: 12px 0 20px;
  text-align: center;
}
</style>
