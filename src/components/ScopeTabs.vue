<template>
  <!-- Classement affiché : le monde, le pays du joueur ou cet appareil (le monde et le pays seulement si la base est configurée). -->
  <pill-tabs v-if="worldEnabled" v-model="scope" :items="items" :overlap="overlap" class="scope" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PillTabs from './PillTabs.vue'
import { scope, worldEnabled, type Scope } from '@/games/worldScores'
import { countryByCode, flag } from '@/player/countries'
import { profile } from '@/player/profile'

/** `overlap` : à cheval sur le bas d'un bandeau (écran des meilleurs scores). */
defineProps<{ overlap?: boolean }>()

const items = computed<{ id: Scope; label: string }[]>(() => [
  { id: 'monde', label: '🌍 Monde' },
  { id: 'pays', label: `${flag(profile.value.country)} ${countryByCode(profile.value.country)?.name ?? 'Pays'}` },
  { id: 'appareil', label: '📱 Appareil' },
])
</script>

<style scoped>
.scope {
  margin-bottom: 16px;
}
</style>
