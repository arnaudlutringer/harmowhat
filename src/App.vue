<template>
  <ion-app>
    <ion-router-outlet />
    <splash-screen :visible="splash" />
    <!-- Trophées gagnés hors partie : annoncés tout de suite, sur l'écran en cours. -->
    <trophy-announcer v-if="!splash" />
  </ion-app>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonApp, IonRouterOutlet, useBackButton, useIonRouter } from '@ionic/vue'
import SplashScreen from '@/components/SplashScreen.vue'
import TrophyAnnouncer from '@/components/TrophyAnnouncer.vue'
import { useRouter } from 'vue-router'
import { App } from '@capacitor/app'
import { setAppInBackground, stopAll } from '@/audio/engine'
import { syncWorldScores } from '@/games/worldScores'
import { flushEvents } from '@/games/tracking'
import { online } from '@/player/online'
import { featureEnabled } from '@/config/features'
import { parseCode, refreshUnseen } from '@/games/matches'

const router = useRouter()
const ionRouter = useIonRouter()

// Bouton retour du téléphone (Android). Sans écouteur, Capacitor ne prévient pas Ionic et l'appli se ferme :
// avec cet écouteur, le bouton passe par les gestionnaires ci-dessous (et par la popin des jeux en cours).
void App.addListener('backButton', () => {}).catch(() => {})

// En quittant l'appli (barre de navigation, autre appli, écran éteint), toute musique en cours est coupée.
void App.addListener('pause', () => setAppInBackground(true)).catch(() => {})
void App.addListener('resume', () => setAppInBackground(false)).catch(() => {})
document.addEventListener('visibilitychange', () => setAppInBackground(document.visibilityState === 'hidden'))

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
// Mesure d'utilisation : les actions notées hors connexion partent au lancement et au retour dans l'appli.
void flushEvents()
void App.addListener('resume', () => void flushEvents()).catch(() => {})
// Retour de la connexion : les scores en attente partent, et les classements en cache se rechargent.
watch(online, (now) => now && void syncWorldScores())

// Matchs (fonctionnalité en préparation) : nouveaux résultats au lancement et au retour dans l'appli ;
// un lien direct loreille://match/CODE ouvre le match.
if (featureEnabled('matchs')) {
  refreshUnseen()
  void App.addListener('resume', refreshUnseen).catch(() => {})
  void App.addListener('appUrlOpen', ({ url }) => {
    const code = parseCode(url.match(/match\/([A-Za-z0-9]{6})/)?.[1] ?? '')
    if (code) void router.push(`/match/${code}`)
  }).catch(() => {})
}

// Bouton retour du téléphone : on coupe le son, puis Ionic revient à l'écran précédent.
useBackButton(10, (processNextHandler) => {
  stopAll()
  processNextHandler()
})

// Bouton retour du téléphone, hors partie (les jeux et leur écran de fin ont leur propre règle, dans GameShell) :
// - à l'accueil : on quitte l'appli ;
// - sur les réglages d'un jeu et sur les onglets de la barre du bas : retour à l'accueil ;
// - ailleurs (meilleurs scores, infos, écran diapason…) : l'écran précédent, sinon l'accueil.
const TABS = ['/trophees', '/hall-of-fame', '/parametres', '/matchs']
useBackButton(-1, () => {
  const path = router.currentRoute.value.path
  if (path === '/home') void App.exitApp().catch(() => {})
  else if (/^\/games\/[^/]+$/.test(path) || TABS.includes(path)) ionRouter.navigate('/home', 'back', 'replace')
  else if (ionRouter.canGoBack()) ionRouter.back()
  else ionRouter.navigate('/home', 'back', 'replace')
})
</script>
