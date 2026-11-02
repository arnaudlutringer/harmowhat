<template>
  <game-settings
    game="tonalite"
    title="La tonalité"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.tonalite.settings"
    play-path="/games/tonalite/jouer"
    :parse="parseSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/keySignature'
</script>