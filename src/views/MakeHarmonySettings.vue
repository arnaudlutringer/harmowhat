<template>
  <game-settings
    game="fais-harmonie"
    title="Fais l'harmonie"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.fais-harmonie.settings"
    play-path="/games/fais-harmonie/jouer"
    :parse="parseSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/makeHarmony'
</script>