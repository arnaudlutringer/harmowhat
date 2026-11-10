<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Mes trophées" />
      <div class="trophies">
        <p class="count">
          <strong>{{ earnedCount }}</strong> / {{ TROPHIES.length }} trophées
        </p>
        <!-- Par famille : les trophées gagnés en couleur (avec leur date), les autres grisés avec leur condition. -->
        <section v-for="(label, family) in FAMILIES" :key="family">
          <h2>{{ label }}</h2>
          <p v-if="family === 'goat'" class="hint">La médaille du GOAT est le diamant bleu ; à côté, le niveau le plus haut où tu l'as gagné.</p>
          <div class="grid">
            <div v-for="t in byFamily(family)" :key="t.id" class="trophy" :class="{ earned: earnedTrophies[t.id] }">
              <span class="icon" aria-hidden="true">{{ t.icon }}</span>
              <span class="text">
                <strong>
                  {{ t.title }}
                  <span v-if="earnedTrophies[t.id]?.tier" class="goat-tier"><medal-dot kind="goat" :size="11" label="" aria-hidden="true" /> {{ TIER_LABELS[earnedTrophies[t.id].tier!].label }}</span>
                </strong>
                <small>{{ t.condition }}</small>
                <small v-if="earnedTrophies[t.id]" class="date">Gagné le {{ formatDate(earnedTrophies[t.id].date) }}</small>
              </span>
              <ion-button
                v-if="earnedTrophies[t.id]"
                class="share"
                fill="clear"
                :aria-label="`Partager le trophée ${t.title}`"
                title="Partager"
                @click="share(t)"
              >
                <ion-icon slot="icon-only" :icon="shareSocialOutline" />
              </ion-button>
            </div>
          </div>
        </section>
      </div>
    </ion-content>
    <bottom-nav active="/trophees" />
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/vue'
import { shareSocialOutline } from 'ionicons/icons'
import PageNav from '@/components/PageNav.vue'
import MedalDot from '@/components/MedalDot.vue'
import BottomNav from '@/components/BottomNav.vue'
import { earnedTrophies, FAMILIES, TIER_LABELS, TROPHIES, type Trophy, type TrophyFamily } from '@/games/trophies'
import { shareImage } from '@/share/shareImage'

const earnedCount = computed(() => TROPHIES.filter((t) => earnedTrophies.value[t.id]).length)
const byFamily = (family: TrophyFamily) => TROPHIES.filter((t) => t.family === family)
/** Image de partage d'un trophée gagné (avec sa médaille pour un GOAT). */
function share(t: Trophy) {
  const tier = earnedTrophies.value[t.id]?.tier
  const label = tier ? `💎 GOAT · Niveau ${TIER_LABELS[tier].label}` : undefined
  shareImage({ kind: 'trophy', title: t.title, condition: t.condition, icon: t.icon, game: t.game, tier: label }).catch(() => {})
}
const formatDate =(iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<style scoped>
.trophies {
  max-width: 480px;
  margin: 0 auto;
}
.count {
  margin: 12px 0 4px;
  color: var(--ion-color-medium);
}
.count strong {
  font-size: 28px;
  color: var(--ion-color-primary);
}
h2 {
  margin: 20px 0 8px;
  font-family: 'Dancing Script', cursive;
  font-size: 26px;
  color: var(--ion-color-primary);
}
.hint {
  margin: -4px 0 8px;
  font-size: 13px;
  color: var(--ion-color-medium);
}
.grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
/* Trophée pas encore gagné : grisé. */
.trophy {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(45, 48, 71, 0.05);
  opacity: 0.55;
}
.trophy .icon {
  font-size: 30px;
  filter: grayscale(1);
}
.trophy.earned {
  background: var(--hw-surface);
  opacity: 1;
  box-shadow: 0 2px 0 rgba(108, 92, 231, 0.35), 0 4px 10px rgba(45, 48, 71, 0.08);
}
.trophy.earned .icon {
  filter: none;
}
.text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.share {
  flex: none;
  margin: 0;
  --color: var(--ion-color-primary);
}
.text small {
  font-size: 12px;
  color: var(--ion-color-medium);
}
/* Niveau du GOAT, à côté de son diamant. */
.goat-tier {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #3aa7d8;
}
.text .date {
  color: var(--ion-color-primary);
}
</style>
