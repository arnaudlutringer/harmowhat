<template>
  <game-settings
    game="lis-chante"
    title="Chante en continu"
    :levels="SIGHT_LEVELS"
    :question-counts="SIGHT_QUESTION_COUNTS"
    storage-key="harmowhat.lis-chante.settings"
    play-path="/games/lis-chante/jouer"
    :parse="parseSightSettings"
    :next-path="(s) => `/games/lis-chante/jouer?questions=${s.questions}&level=${s.level}${fast ? `&tempo=${FAST_TRIAL_TEMPO}` : ''}`"
  >
    <template #extra><trial-tempo v-model="fast" /></template>
  </game-settings>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GameSettings from '@/components/GameSettings.vue'
import TrialTempo from '@/components/TrialTempo.vue'
import { FAST_TRIAL_TEMPO, parseSightSettings, SIGHT_LEVELS, SIGHT_QUESTION_COUNTS } from '@/games/sightReading'

/** Essai rapide (le tempo n'est appliqué qu'à « Un essai »). */
const fast = ref(false)
</script>
