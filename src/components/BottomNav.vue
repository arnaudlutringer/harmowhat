<template>
  <!-- Barre du bas : les quatre écrans principaux, l'actif en violet. -->
  <ion-footer class="ion-no-border">
    <nav class="bottom-nav" aria-label="Navigation principale">
      <button
        v-for="item in ITEMS"
        :key="item.path"
        :class="{ on: active === item.path }"
        :aria-current="active === item.path ? 'page' : undefined"
        :data-trophy-target="item.path === '/trophees' ? '' : undefined"
        @click="go(item.path)"
      >
        <ion-icon :icon="active === item.path ? item.iconOn : item.icon" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <i v-if="item.path === '/trophees' && pendingTrophyCount" class="dot" aria-label="Nouveaux trophées" />
        <i v-if="item.path === '/matchs' && unseenResults" class="dot" aria-label="Nouveaux résultats de matchs" />
      </button>
    </nav>
  </ion-footer>
</template>

<script setup lang="ts">
import { IonFooter, IonIcon, useIonRouter } from '@ionic/vue'
import { flash, flashOutline, medal, medalOutline, musicalNotes, musicalNotesOutline, settings, settingsOutline, trophy, trophyOutline } from 'ionicons/icons'
import { featureEnabled } from '@/config/features'
import { matchesAvailable, unseenResults } from '@/games/matches'
import { pendingTrophyCount } from '@/games/trophies'

const props = defineProps<{ active: '/home' | '/trophees' | '/hall-of-fame' | '/matchs' | '/parametres' }>()

const ALL_ITEMS = [
  { path: '/home', label: 'Jeux', icon: musicalNotesOutline, iconOn: musicalNotes },
  { path: '/trophees', label: 'Trophées', icon: medalOutline, iconOn: medal },
  { path: '/hall-of-fame', label: 'Hall of fame', icon: trophyOutline, iconOn: trophy },
  { path: '/matchs', label: 'Matchs', icon: flashOutline, iconOn: flash },
  { path: '/parametres', label: 'Paramètres', icon: settingsOutline, iconOn: settings },
] as const
// « Matchs » seulement quand la fonctionnalité est activée (voir config/features.ts).
const ITEMS = ALL_ITEMS.filter((i) => i.path !== '/matchs' || (featureEnabled('matchs') && matchesAvailable))

const router = useIonRouter()

// Les quatre écrans sont au même niveau : on passe de l'un à l'autre sans empiler l'historique.
function go(path: string) {
  if (path === props.active) return
  router.navigate(path, 'root', 'replace')
}
</script>

<style scoped>
.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 6px 4px calc(6px + var(--ion-safe-area-bottom, 0px));
  background: var(--hw-surface, #fff);
  box-shadow: 0 -4px 14px rgba(45, 48, 71, 0.08);
}
.bottom-nav button {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  border: none;
  background: none;
  color: var(--ion-color-medium);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}
.bottom-nav ion-icon {
  font-size: 24px;
}
.bottom-nav .on {
  color: var(--ion-color-primary);
  font-weight: 700;
}
.dot {
  position: absolute;
  top: 2px;
  left: calc(50% + 8px);
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ion-color-danger);
}
</style>
