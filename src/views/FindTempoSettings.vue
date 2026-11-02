<template>
  <game-settings
    game="trouve-tempo"
    title="Trouve le tempo"
    :levels="FIND_LEVELS"
    :question-counts="FIND_QUESTION_COUNTS"
    storage-key="harmowhat.trouve-tempo.settings"
    play-path="/games/trouve-tempo/jouer"
    :parse="parseFindSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { FIND_LEVELS, parseFindSettings, FIND_QUESTION_COUNTS } from '@/games/tempo'
</script>