import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import { isTutorialDone } from '@/tutorial'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: HomePage },
  { path: '/tutoriel', component: () => import('@/views/TutorialPage.vue') },
  { path: '/parametres', component: () => import('@/views/SettingsPage.vue') },
  { path: '/infos', component: () => import('@/views/InfoPage.vue') },
  { path: '/hall-of-fame', component: () => import('@/views/HallOfFamePage.vue') },
  // L'écran Joueur est un onglet des paramètres.
  { path: '/joueur', redirect: '/parametres?onglet=joueur' },
  { path: '/scores/:game', component: () => import('@/views/ScoresPage.vue') },
  { path: '/games/grave-ou-aigu', component: () => import('@/views/HighLowSettings.vue') },
  { path: '/games/grave-ou-aigu/jouer', component: () => import('@/views/HighLowGame.vue') },
  { path: '/games/quelle-note', component: () => import('@/views/NameTheNoteSettings.vue') },
  { path: '/games/accords', component: () => import('@/views/ChordsSettings.vue') },
  { path: '/games/accords/jouer', component: () => import('@/views/ChordsGame.vue') },
  { path: '/games/quelle-note/jouer', component: () => import('@/views/NameTheNoteGame.vue') },
  { path: '/games/harmonies', component: () => import('@/views/IntervalsSettings.vue') },
  { path: '/games/:game(quelle-note)/pret', component: () => import('@/views/ReadyPage.vue') },
  { path: '/games/harmonies/jouer', component: () => import('@/views/IntervalsGame.vue') },
  { path: '/games/lecture-note', component: () => import('@/views/ReadNoteSettings.vue') },
  { path: '/games/lecture-note/jouer', component: () => import('@/views/ReadNoteGame.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Première ouverture : le tutoriel passe avant l'accueil.
router.beforeEach((to) => (to.path === '/home' && !isTutorialDone() ? '/tutoriel' : true))

export default router
