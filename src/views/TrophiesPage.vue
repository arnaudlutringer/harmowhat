<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Mes trophées" back-href="/home" />
      <div class="trophies">
        <p class="count">
          <strong>{{ earnedCount }}</strong> / {{ TROPHIES.length }} trophées
        </p>
        <!-- Par famille : les trophées gagnés en couleur (avec leur date), les autres grisés avec leur condition. -->
        <section v-for="(label, family) in FAMILIES" :key="family">
          <h2>{{ label }}</h2>
          <p v-if="family === 'goat'" class="hint">Médaille 🥉 en débutant, 🥈 en normal, 🥇 en expert.</p>
          <div class="grid">
            <div v-for="t in byFamily(family)" :key="t.id" class="trophy" :class="{ earned: earnedTrophies[t.id] }">
              <span class="icon" aria-hidden="true">{{ t.icon }}</span>
              <span class="text">
                <strong>
                  {{ t.title }}
                  <span v-if="earnedTrophies[t.id]?.tier" :title="TIER_LABELS[earnedTrophies[t.id].tier!].label">{{ TIER_LABELS[earnedTrophies[t.id].tier!].medal }}</span>
                </strong>
                <small>{{ t.condition }}</small>
                <small v-if="earnedTrophies[t.id]" class="date">Gagné le {{ formatDate(earnedTrophies[t.id].date) }}</small>
              </span>
            </div>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonContent, IonPage } from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import { earnedTrophies, FAMILIES, TIER_LABELS, TROPHIES, type TrophyFamily } from '@/games/trophies'

const earnedCount = computed(() => TROPHIES.filter((t) => earnedTrophies.value[t.id]).length)
const byFamily = (family: TrophyFamily) => TROPHIES.filter((t) => t.family === family)
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
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
  background: #fff;
  opacity: 1;
  box-shadow: 0 2px 0 rgba(108, 92, 231, 0.35), 0 4px 10px rgba(45, 48, 71, 0.08);
}
.trophy.earned .icon {
  filter: none;
}
.text {
  display: flex;
  flex-direction: column;
}
.text small {
  font-size: 12px;
  color: var(--ion-color-medium);
}
.text .date {
  color: var(--ion-color-primary);
}
</style>
