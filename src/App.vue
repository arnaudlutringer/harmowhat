<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, useBackButton, useIonRouter } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { App } from '@capacitor/app'
import { stopAll } from '@/audio/engine'

const router = useRouter()
const ionRouter = useIonRouter()

// Bouton retour du téléphone (Android). Sans écouteur, Capacitor ne prévient pas Ionic et l'appli se ferme :
// avec cet écouteur, le bouton passe par les gestionnaires ci-dessous (et par la popin des jeux en cours).
void App.addListener('backButton', () => {}).catch(() => {})

// Bouton retour du téléphone : on coupe le son, puis Ionic revient à l'écran précédent.
useBackButton(10, (processNextHandler) => {
  stopAll()
  processNextHandler()
})

// Plus rien derrière (par exemple le Hall of fame ouvert après « Accueil », qui repart de zéro) :
// on revient à l'accueil ; sur l'accueil, on met l'appli en arrière-plan au lieu de la fermer.
useBackButton(-1, () => {
  if (router.currentRoute.value.path !== '/home') ionRouter.navigate('/home', 'back', 'replace')
  else void App.minimizeApp().catch(() => {})
})
</script>
