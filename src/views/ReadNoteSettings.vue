<template>
  <game-settings
    game="lecture-note"
    title="Lecture de note"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.lecture-note.settings"
    play-path="/games/lecture-note/jouer"
    :parse="parseSettings"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/readNote'
</script>