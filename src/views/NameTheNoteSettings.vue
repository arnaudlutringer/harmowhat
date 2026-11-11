<template>
  <game-settings
    game="quelle-note"
    title="Quelle note ?"
    :levels="LEVELS"
    :question-counts="QUESTION_COUNTS"
    storage-key="harmowhat.quelle-note.settings"
    play-path="/games/quelle-note/jouer"
    :parse="parseSettings"
    :next-path="nextPath"
  >
    <!-- Tessiture jouée à ce niveau, selon l'instrument choisi. -->
    <template #level-extra="{ level }">
      <small class="range">
        {{ LEVELS[level as Level].randomInstrument ? 'Instrument au hasard' : `${instrument.label} : ${noteName(levelRange(level as Level, instrument).low)} à ${noteName(levelRange(level as Level, instrument).high)}` }}
      </small>
    </template>
  </game-settings>
</template>

<script setup lang="ts">
import { onIonViewWillLeave } from '@ionic/vue'
import GameSettings from '@/components/GameSettings.vue'
import { stopAll } from '@/audio/engine'
import { afterSettings } from '@/games/ready'
import { levelRange, LEVELS, parseSettings, QUESTION_COUNTS, type Level } from '@/games/nameTheNote'
import { currentInstrument } from '@/audio/instruments'
import { noteName } from '@/music/notes'

const instrument = currentInstrument()

// Le diapason s'arrête dès qu'on quitte l'écran.
onIonViewWillLeave(stopAll)

// En expert, pas de diapason pendant les questions : il est proposé sur l'écran « Je suis prêt » (en impossible, pas du tout).
const nextPath = ({ questions, level }: { questions: number; level: string }) =>
  afterSettings('quelle-note', level === 'expert', `questions=${questions}&level=${level}`)
</script>

<style scoped>
.range {
  font-size: 11px;
  color: var(--ion-color-primary);
}
</style>