import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/views/HomePage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: HomePage },
  { path: '/parametres', component: () => import('@/views/SettingsPage.vue') },
  { path: '/infos', component: () => import('@/views/InfoPage.vue') },
  { path: '/hall-of-fame', component: () => import('@/views/HallOfFamePage.vue') },
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

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
