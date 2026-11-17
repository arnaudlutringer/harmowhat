<template>
  <!-- Comme le diapason, mais pour une note de référence qui change (« Grave ou aigu ? » en expert et en Impossible) :
       une note de musique à la place du diapason, pour ne pas laisser croire que c'est le La3. -->
  <ion-button fill="clear" :class="{ ringing: playing }" :disabled="playing" :aria-label="`Réécouter la note de référence, ${name}`" :title="`Note de référence (${name})`" @click="play">
    <ion-icon slot="icon-only" :icon="musicalNote" class="note" aria-hidden="true" />
  </ion-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { musicalNote } from 'ionicons/icons'
import { playPiano } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'
import type { Instrument } from '@/audio/instruments'
import { noteName } from '@/music/notes'

const props = defineProps<{ midi: number; instrument?: Instrument }>()
const emit = defineEmits<{ played: [] }>()
const { playing, track } = usePlaying()
const name = computed(() => noteName(props.midi))

function play() {
  emit('played')
  track(playPiano(props.midi, { instrument: props.instrument, duration: 2, fadeOut: 0.5 }))
}
</script>

<style scoped>
.note {
  font-size: 26px;
}
/* Pendant le son : la note vibre et passe en couleur secondaire, comme le diapason. */
.ringing {
  --color: var(--ion-color-secondary);
  opacity: 1;
}
.ringing .note {
  animation: vibrate 0.12s linear infinite;
}
@keyframes vibrate {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(-6deg);
  }
  75% {
    transform: rotate(6deg);
  }
}
</style>
