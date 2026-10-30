<template>
  <game-settings
    game="quel-rythme"
    title="Quel rythme ?"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.quel-rythme.settings"
    play-path="/games/quel-rythme/jouer"
    :parse="parseSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/rhythm'
</script>
