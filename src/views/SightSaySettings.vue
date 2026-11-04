<template>
  <game-settings
    game="lis-dis"
    title="Lecture continue"
    :levels="SIGHT_LEVELS"
    :question-counts="SIGHT_QUESTION_COUNTS"
    storage-key="harmowhat.lis-dis.settings"
    play-path="/games/lis-dis/jouer"
    :parse="parseSightSettings"
    needs-online
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { parseSightSettings, SIGHT_LEVELS, SIGHT_QUESTION_COUNTS } from '@/games/sightReading'
</script>
