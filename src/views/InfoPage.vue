<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="" />
        </ion-buttons>
        <ion-title>Informations</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
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
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage, IonTitle, IonToolbar,
} from '@ionic/vue'
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
