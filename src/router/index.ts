import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import { isTutorialDone } from '@/tutorial'
import { featureEnabled, gameEnabled } from '@/config/features'
import type { GameId } from '@/games/highScores'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: HomePage },
  { path: '/tutoriel', component: () => import('@/views/TutorialPage.vue') },
  { path: '/parametres', component: () => import('@/views/SettingsPage.vue') },
  { path: '/infos', component: () => import('@/views/InfoPage.vue') },
  { path: '/hall-of-fame', component: () => import('@/views/HallOfFamePage.vue') },
  { path: '/trophees', component: () => import('@/views/TrophiesPage.vue') },
  // L'écran Joueur est un onglet des paramètres.
  { path: '/joueur', redirect: '/parametres?onglet=joueur' },
  // Matchs (fonctionnalité en préparation, voir config/features.ts) ; lien direct loreille://match/CODE.
  { path: '/matchs', component: () => import('@/views/MatchesPage.vue') },
  { path: '/match/:code', redirect: (to) => ({ path: '/matchs', query: { onglet: 'relever', code: String(to.params.code) } }) },
  { path: '/scores/:game', component: () => import('@/views/ScoresPage.vue') },
  { path: '/games/grave-ou-aigu', component: () => import('@/views/HighLowSettings.vue') },
  { path: '/games/grave-ou-aigu/jouer', component: () => import('@/views/HighLowGame.vue') },
  { path: '/games/quelle-note', component: () => import('@/views/NameTheNoteSettings.vue') },
  { path: '/games/accords', component: () => import('@/views/ChordsSettings.vue') },
  { path: '/games/accords/jouer', component: () => import('@/views/ChordsGame.vue') },
  { path: '/games/quelle-note/jouer', component: () => import('@/views/NameTheNoteGame.vue') },
  { path: '/games/harmonies', component: () => import('@/views/IntervalsSettings.vue') },
  { path: '/games/:game(quelle-note|chante-note)/pret', component: () => import('@/views/ReadyPage.vue') },
  { path: '/games/harmonies/jouer', component: () => import('@/views/IntervalsGame.vue') },
  { path: '/games/lecture-note', component: () => import('@/views/ReadNoteSettings.vue') },
  { path: '/games/lecture-note/jouer', component: () => import('@/views/ReadNoteGame.vue') },
  { path: '/games/fais-harmonie', component: () => import('@/views/MakeHarmonySettings.vue') },
  { path: '/games/fais-harmonie/jouer', component: () => import('@/views/MakeHarmonyGame.vue') },
  { path: '/games/tonalite', component: () => import('@/views/KeySignatureSettings.vue') },
  { path: '/games/tonalite/jouer', component: () => import('@/views/KeySignatureGame.vue') },
  { path: '/games/modalite', component: () => import('@/views/ModalitySettings.vue') },
  { path: '/games/modalite/jouer', component: () => import('@/views/ModalityGame.vue') },
  { path: '/games/chante-note', component: () => import('@/views/SingTheNoteSettings.vue') },
  { path: '/games/chante-note/jouer', component: () => import('@/views/SingTheNoteGame.vue') },
  { path: '/games/chante-harmonie', component: () => import('@/views/SingHarmonySettings.vue') },
  { path: '/games/chante-harmonie/jouer', component: () => import('@/views/SingHarmonyGame.vue') },
  { path: '/games/quel-rythme', component: () => import('@/views/WhichRhythmSettings.vue') },
  { path: '/games/quel-rythme/jouer', component: () => import('@/views/WhichRhythmGame.vue') },
  { path: '/games/joue-rythme', component: () => import('@/views/PlayRhythmSettings.vue') },
  { path: '/games/joue-rythme/jouer', component: () => import('@/views/PlayRhythmGame.vue') },
  { path: '/games/garde-tempo', component: () => import('@/views/KeepTempoSettings.vue') },
  { path: '/games/garde-tempo/jouer', component: () => import('@/views/KeepTempoGame.vue') },
  { path: '/games/trouve-tempo', component: () => import('@/views/FindTempoSettings.vue') },
  { path: '/games/trouve-tempo/jouer', component: () => import('@/views/FindTempoGame.vue') },
  // Lecture en défilement (interrupteurs lectureChantee et lectureParlee, voir config/features.ts).
  { path: '/games/lis-chante', component: () => import('@/views/SightSingSettings.vue') },
  { path: '/games/lis-chante/jouer', component: () => import('@/views/SightSingGame.vue') },
  { path: '/games/lis-dis', component: () => import('@/views/SightSaySettings.vue') },
  { path: '/games/lis-dis/jouer', component: () => import('@/views/SightSayGame.vue') },
  // Test du micro (interrupteur testMicro).
  { path: '/debug/micro', component: () => import('@/views/MicTestPage.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Première ouverture : le tutoriel passe avant l'accueil.
// Un jeu dont l'interrupteur est coupé n'existe pas : retour à l'accueil.
router.beforeEach((to) => {
  if (to.path === '/home' && !isTutorialDone()) return '/tutoriel'
  const game = /^\/(?:games|scores)\/([^/]+)/.exec(to.path)?.[1]
  if (game && !gameEnabled(game as GameId)) return '/home'
  if (to.path.startsWith('/debug/') && !featureEnabled('testMicro')) return '/home'
  return true
})

export default router
