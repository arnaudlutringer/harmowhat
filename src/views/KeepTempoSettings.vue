<template>
  <game-settings
    game="garde-tempo"
    title="Garde le tempo"
    :levels="KEEP_LEVELS"
    :question-counts="KEEP_QUESTION_COUNTS"
    storage-key="harmowhat.garde-tempo.settings"
    play-path="/games/garde-tempo/jouer"
    :parse="parseKeepSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { KEEP_LEVELS, parseKeepSettings, KEEP_QUESTION_COUNTS } from '@/games/tempo'
</script>