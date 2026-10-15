<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Paramètres" back-href="/home" />
      <div class="settings">
        <h2>Instrument</h2>
        <p class="hint">Il joue les notes et les accords de tous les jeux. Les questions restent dans sa tessiture.</p>
        <ion-radio-group :value="selectedInstrument" @ion-change="choose($event.detail.value)">
          <ion-item v-for="inst in INSTRUMENTS" :key="inst.id" lines="full">
            <ion-radio :value="inst.id" justify="space-between">
              <ion-label>
                <strong>{{ inst.emoji }} {{ inst.label }}</strong>
                <p>De {{ noteName(inst.low) }} à {{ noteName(inst.high) }}</p>
              </ion-label>
            </ion-radio>
          </ion-item>
        </ion-radio-group>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent, IonItem, IonLabel, IonPage, IonRadio, IonRadioGroup,
} from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import { INSTRUMENTS, selectedInstrument, setInstrument, type InstrumentId } from '@/audio/instruments'
import { playPiano, preloadPiano } from '@/audio/engine'
import { A440, noteName } from '@/music/notes'

// Le joueur entend tout de suite le nouvel instrument (La3 du diapason).
function choose(id: InstrumentId) {
  setInstrument(id)
  void playPiano(A440, { duration: 1.5 })
  void preloadPiano().catch(() => undefined)
}
</script>

<style scoped>
.settings {
  max-width: 480px;
  margin: 0 auto;
}
h2 {
  font-size: 18px;
  margin: 24px 0 8px;
}
.hint,
ion-label p {
  color: var(--ion-color-medium);
}
ion-radio {
  width: 100%;
}
</style>
