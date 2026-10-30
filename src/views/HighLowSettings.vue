<template>
  <game-settings
    game="grave-ou-aigu"
    title="Grave ou aigu ?"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.grave-ou-aigu.settings"
    play-path="/games/grave-ou-aigu/jouer"
    :parse="parseSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/highLow'
</script>
