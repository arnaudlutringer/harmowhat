<template>
  <!-- Une ligne de choix (instrument, morceau) : un bloc blanc qu'on touche pour choisir, et un bouton d'écoute au trait. -->
  <div class="row" :class="{ chosen }">
    <ion-button class="main" :aria-pressed="chosen" @click="emit('pick')"><slot /></ion-button>
    <button class="listen" :class="{ 'is-playing': playing }" :aria-label="listenLabel" @click="emit('listen')">
      <ion-icon :icon="playing ? stop : play" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import { play, stop } from 'ionicons/icons'

defineProps<{
  /** Libellé du bouton d'écoute, pour les lecteurs d'écran. */
  listenLabel: string
  playing?: boolean
  /** Choix actuel : bloc encadré de violet. */
  chosen?: boolean
}>()
const emit = defineEmits<{ pick: []; listen: [] }>()
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.main {
  flex: 1;
  margin: 0;
  text-transform: none;
  --padding-start: 12px;
}
.row.chosen .main {
  --background: var(--hw-button-active);
  --border-color: var(--ion-color-primary);
  --border-style: solid;
  --border-width: 2px;
}
/* Bouton d'écoute discret (au trait) : le bloc reste l'élément principal. */
.listen {
  flex: none;
  width: 40px;
  height: 40px;
  border: 2px solid var(--ion-color-primary);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 18px;
  color: var(--ion-color-primary);
  background: transparent;
  cursor: pointer;
}
.listen.is-playing {
  border-color: var(--ion-color-secondary);
}
</style>
