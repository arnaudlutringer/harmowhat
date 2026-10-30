<template>
  <trophy-unlocked :queue="queue" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import TrophyUnlocked from './TrophyUnlocked.vue'
import { pendingTrophyCount, takePendingTrophies, type Tier, type Trophy } from '@/games/trophies'

/**
 * Annonce des trophées sur tous les écrans, dès qu'ils sont gagnés (fin du tutoriel, écoute dans les paramètres,
 * question d'essai…), sauf en pleine partie : là, ils attendent l'écran de résultat, qui les annonce lui-même.
 */
const route = useRoute()
const queue = ref<{ trophy: Trophy; tier?: Tier }[]>([])

const inGame = () => route.path.endsWith('/jouer')

watch(
  [pendingTrophyCount, () => route.fullPath],
  ([count]) => {
    if (count > 0 && !inGame()) queue.value = [...queue.value, ...takePendingTrophies()]
  },
  { immediate: true },
)
</script>
