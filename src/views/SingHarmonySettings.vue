<template>
  <game-settings
    game="chante-harmonie"
    title="Chante l'harmonie"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.chante-harmonie.settings"
    play-path="/games/chante-harmonie/jouer"
    :parse="parseSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/singHarmony'
</script>
