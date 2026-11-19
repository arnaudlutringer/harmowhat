<template>
  <!-- La précision suit le niveau (simple en débutant, précise ensuite) : pas de réglage à part. -->
  <game-settings
    game="harmonies"
    title="Les harmonies"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.harmonies.settings"
    play-path="/games/harmonies/jouer"
    :parse="parseSettings"
    :next-path="nextPath"
    :board-level="(level) => `${level}-${precisionFor(level as Level)}`"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { LEVELS, parseSettings, precisionFor, QUESTION_COUNTS, type Level } from '@/games/intervals'

const nextPath = ({ questions, level }: { questions: number; level: string }) => `/games/harmonies/jouer?questions=${questions}&level=${level}`
</script>
