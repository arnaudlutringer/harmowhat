<template>
  <game-settings
    game="accords"
    title="Les accords"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.accords.settings"
    play-path="/games/accords/jouer"
    :parse="parseSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/chords'
</script>
