<template>
  <game-settings
    game="joue-rythme"
    title="Joue le rythme"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.joue-rythme.settings"
    play-path="/games/joue-rythme/jouer"
    :parse="parseSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/rhythm'
</script>
