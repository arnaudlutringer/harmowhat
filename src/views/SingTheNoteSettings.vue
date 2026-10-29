<template>
  <game-settings
    game="chante-note"
    title="Chante la note"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.chante-note.settings"
    play-path="/games/chante-note/jouer"
    :parse="parseSettings"
    :next-path="nextPath"
  />
</template>

<script setup lang="ts">
import GameSettings from '@/components/GameSettings.vue'
import { afterSettings } from '@/games/ready'
import { LEVELS, parseSettings, QUESTION_COUNTS } from '@/games/singTheNote'

// En expert, pas de diapason pendant les questions : il est proposé sur l'écran « Je suis prêt ».
const nextPath = ({ questions, level }: { questions: number; level: string }) =>
  afterSettings('chante-note', level === 'expert', `questions=${questions}&level=${level}`)
</script>
