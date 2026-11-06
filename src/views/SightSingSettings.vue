<template>
  <game-settings
    game="lis-chante"
    title="Chante en continu"
    :levels="SING_LEVELS"
    :question-counts="SIGHT_QUESTION_COUNTS"
    storage-key="harmowhat.lis-chante.settings"
    play-path="/games/lis-chante/jouer"
    :parse="parseSightSettings"
    :next-path="nextPath"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { afterSettings } from '@/games/ready'
import { parseSightSettings, SIGHT_QUESTION_COUNTS, SING_LEVELS } from '@/games/sightReading'

// Pas de diapason pendant la partie : il est proposé avant, sur l'écran « Je suis prêt ».
const nextPath = ({ questions, level }: { questions: number; level: string }) => afterSettings('lis-chante', true, `questions=${questions}&level=${level}`)
</script>
