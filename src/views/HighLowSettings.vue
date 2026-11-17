<template>
  <game-settings
    game="grave-ou-aigu"
    title="Grave ou aigu ?"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.grave-ou-aigu.settings"
    play-path="/games/grave-ou-aigu/jouer"
    :parse="parseSettings"
    :next-path="nextPath"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { afterSettings } from '@/games/ready'
import { LEVELS, parseSettings, QUESTION_COUNTS, type Level } from '@/games/highLow'

// En normal, pas de diapason pendant les questions : il est proposé sur l'écran « Je suis prêt ».
const nextPath = ({ questions, level }: { questions: number; level: string }) =>
  afterSettings('grave-ou-aigu', !!LEVELS[level as Level]?.forkBeforeOnly, `questions=${questions}&level=${level}`)
</script>
