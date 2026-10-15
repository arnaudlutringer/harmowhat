import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/views/HomePage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: HomePage },
  { path: '/parametres', component: () => import('@/views/SettingsPage.vue') },
  { path: '/games/grave-ou-aigu', component: () => import('@/views/HighLowGame.vue') },
  { path: '/games/quelle-note', component: () => import('@/views/NameTheNoteSettings.vue') },
  { path: '/games/accords', component: () => import('@/views/ChordsGame.vue') },
  { path: '/games/quelle-note/jouer', component: () => import('@/views/NameTheNoteGame.vue') },
  { path: '/games/harmonies', component: () => import('@/views/IntervalsSettings.vue') },
  { path: '/games/:game(quelle-note|harmonies)/pret', component: () => import('@/views/ReadyPage.vue') },
  { path: '/games/harmonies/jouer', component: () => import('@/views/IntervalsGame.vue') },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
