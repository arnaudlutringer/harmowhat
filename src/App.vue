<template>
  <ion-app>
    <ion-router-outlet />
    <splash-screen :visible="splash" />
    <!-- Trophées gagnés hors partie : annoncés tout de suite, sur l'écran en cours. -->
    <trophy-announcer v-if="!splash" />
  </ion-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonApp, IonRouterOutlet, useBackButton, useIonRouter } from '@ionic/vue'
import SplashScreen from '@/components/SplashScreen.vue'
import TrophyAnnouncer from '@/components/TrophyAnnouncer.vue'
import { useRouter } from 'vue-router'
import { App } from '@capacitor/app'
import { stopAll } from '@/audio/engine'
import { syncWorldScores } from '@/games/worldScores'

const router = useRouter()
const ionRouter = useIonRouter()

// Bouton retour du téléphone (Android). Sans écouteur, Capacitor ne prévient pas Ionic et l'appli se ferme :
// avec cet écouteur, le bouton passe par les gestionnaires ci-dessous (et par la popin des jeux en cours).
void App.addListener('backButton', () => {}).catch(() => {})

// Classement mondial : au lancement et au retour dans l'appli, les scores en attente partent (et, une fois
// pour toutes, ceux déjà sur l'appareil), puis les classements sont chargés en cache.
// Au lancement, l'écran de démarrage reste le temps de ce chargement : au moins 1,2 s, au plus 5 s
// (sans connexion, l'appli démarre avec le cache précédent).
const SPLASH_MIN_MS = 1200
const SPLASH_MAX_MS = 5000
const splash = ref(true)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
void Promise.race([Promise.all([syncWorldScores(), wait(SPLASH_MIN_MS)]), wait(SPLASH_MAX_MS)]).finally(() => (splash.value = false))
void App.addListener('resume', () => void syncWorldScores()).catch(() => {})

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
