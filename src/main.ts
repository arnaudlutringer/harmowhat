import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
// Palette sombre d'Ionic, active quand <html> porte la classe ion-palette-dark (voir theme/theme.ts).
import '@ionic/vue/css/palettes/dark.class.css'
// Polices embarquées pour fonctionner hors ligne : Fredoka pour toute l'appli, Dancing Script pour le titre.
import '@fontsource-variable/fredoka'
import '@fontsource/dancing-script/700.css'
import './theme/variables.css'
import './theme/playing.css'
import { initTheme } from './theme/theme'

// Thème clair ou sombre appliqué avant l'affichage, sans éclair de l'autre thème.
initTheme()

const app = createApp(App).use(IonicVue).use(router)

router.isReady().then(() => app.mount('#app'))
