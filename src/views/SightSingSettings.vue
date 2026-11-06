<template>
  <game-settings
    game="lis-chante"
    title="Chante en continu"
    :levels="SING_LEVELS"
    :question-counts="SIGHT_QUESTION_COUNTS"
    storage-key="harmowhat.lis-chante.settings"
    play-path="/games/lis-chante/jouer"
    :parse="parseSightSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { parseSightSettings, SIGHT_QUESTION_COUNTS, SING_LEVELS } from '@/games/sightReading'
</script>
