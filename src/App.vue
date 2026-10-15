<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, useBackButton } from '@ionic/vue'
import { App } from '@capacitor/app'
import { stopAll } from '@/audio/engine'

// Bouton retour du téléphone (Android). Sans écouteur, Capacitor ne prévient pas Ionic et l'appli se ferme :
// avec cet écouteur, le bouton passe par les gestionnaires ci-dessous (et par la popin des jeux en cours).
void App.addListener('backButton', () => {}).catch(() => {})

// Bouton retour du téléphone : on coupe le son, puis Ionic revient à l'écran précédent.
useBackButton(10, (processNextHandler) => {
  stopAll()
  processNextHandler()
})

// Sur l'accueil (plus rien derrière), on met l'appli en arrière-plan au lieu de la fermer.
useBackButton(-1, () => {
  void App.minimizeApp().catch(() => {})
})
</script>
