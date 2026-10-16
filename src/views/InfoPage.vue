<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Informations" back-href="/home" />
      <div class="info">
        <h2>Sons</h2>
        <ion-list lines="full">
          <ion-item>
            <ion-label class="ion-text-wrap">
              <strong>🎹 Piano</strong>
              <p>Salamander Grand Piano, par Alexander Holm.</p>
              <p>
                Licence
                <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>.
              </p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label class="ion-text-wrap">
              <strong>🎻 Autres instruments</strong>
              <p>Musyng Kite SoundFont, rendu MP3 MIDI.js Soundfonts par Benjamin Gleitzman.</p>
              <p>
                Licence
                <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a>.
              </p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-label class="ion-text-wrap">
              <strong>⚡ Guitare électrique</strong>
              <p>tonejs-instruments, par Nicholaus Brosowsky.</p>
              <p>
                Licence
                <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>.
              </p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent, IonItem, IonLabel, IonList, IonPage,
} from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
</script>

<style scoped>
.info {
  max-width: 480px;
  margin: 0 auto;
}
h2 {
  font-size: 18px;
  margin: 24px 0 8px;
}
ion-label p {
  color: var(--ion-color-medium);
}
</style>
