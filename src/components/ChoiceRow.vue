<template>
  <!-- Une ligne de choix (instrument, morceau) : un bloc avec une pastille qu'on coche en le touchant, et l'écoute en retrait à droite. -->
  <div class="row" :class="{ chosen }">
    <button type="button" class="main" role="radio" :aria-checked="!!chosen" @click="emit('pick')">
      <span class="radio" aria-hidden="true">
        <svg v-if="chosen" width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>
      </span>
      <span class="label"><slot /></span>
    </button>
    <button type="button" class="listen" :class="{ 'is-playing': playing }" :aria-label="listenLabel" @click="emit('listen')">
      <span class="disc"><ion-icon :icon="playing ? stop : play" /></span>
      <span aria-hidden="true">{{ playing ? 'Arrêter' : 'Écouter' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { play, stop } from 'ionicons/icons'

defineProps<{
  /** Libellé du bouton d'écoute, pour les lecteurs d'écran. */
  listenLabel: string
  playing?: boolean
  /** Choix actuel : pastille cochée et bloc violet clair. */
  chosen?: boolean
}>()
const emit = defineEmits<{ pick: []; listen: [] }>()
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.main {
  flex: 1;
  min-width: 0;
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px;
  border: 2px solid #ece6f7;
  border-radius: 16px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  text-align: left;
  box-shadow: 0 2px 6px rgba(76, 63, 209, 0.08);
  cursor: pointer;
}
.label {
  flex: 1;
  min-width: 0;
}
/* La pastille : vide, puis violette et cochée une fois choisie. */
.radio {
  flex: none;
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  border: 2px solid #b9b2cc;
  border-radius: 50%;
}
.radio path {
  fill: none;
  stroke: #fff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.row.chosen .main {
  background: var(--hw-button-active);
  border-color: var(--ion-color-primary);
}
.row.chosen .radio {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
}
/* L'écoute, en retrait : un petit rond gris avec « Écouter » dessous. */
.listen {
  flex: none;
  width: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--ion-color-medium);
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.disc {
  width: 30px;
  height: 30px;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  border: 1.5px solid #c9c3d6;
  border-radius: 50%;
  font-size: 14px;
}
.listen.is-playing {
  color: var(--ion-color-primary);
}
.listen.is-playing .disc {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-primary);
  color: #fff;
}
/* Petit écran (Samsung A10) : les 10 instruments tiennent sans défiler. */
@media (max-height: 740px) {
  .main {
    min-height: 40px;
    padding: 3px 12px;
    font-size: 15px;
  }
  .listen {
    gap: 1px;
    font-size: 9px;
  }
  .disc {
    width: 26px;
    height: 26px;
    font-size: 12px;
  }
}
</style>
