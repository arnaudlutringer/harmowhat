<template>
  <game-settings
    game="lis-dis"
    title="Lecture continue"
    :levels="SAY_LEVELS"
    :question-counts="SIGHT_QUESTION_COUNTS"
    storage-key="harmowhat.lis-dis.settings"
    play-path="/games/lis-dis/jouer"
    :parse="parseSightSettings"
    :next-path="nextPath"
    silent
  >
    <template #extra>
      <!-- « Ma voix » : les noms de notes dits par le joueur, demandés avant sa première partie, à refaire quand il veut. -->
      <button class="voice" @click="router.push('/games/lis-dis/voix')">
        🎙️ Ma voix : <strong>{{ ready ? 'enregistrée' : 'à enregistrer' }}</strong>
        <small>{{ ready ? 'Réenregistrer' : 'Avant ta première partie' }} ›</small>
      </button>
    </template>
  </game-settings>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onIonViewWillEnter, useIonRouter } from '@ionic/vue'
import GameSettings from '@/components/GameSettings.vue'
import { parseSightSettings, SAY_LEVELS, SIGHT_QUESTION_COUNTS } from '@/games/sightReading'
import { voiceReady } from '@/games/voiceWords'

const router = useIonRouter()
// Recalculé au retour de « Ma voix » (les enregistrements par le son sont sur l'appareil, pas réactifs).
const refresh = ref(0)
onIonViewWillEnter(() => refresh.value++)
const ready = computed(() => (refresh.value, voiceReady()))

/** Première partie : d'abord « Ma voix », qui ouvre ensuite la partie. */
function nextPath(s: { questions: number; level: string }) {
  const play = `/games/lis-dis/jouer?questions=${s.questions}&level=${s.level}`
  return voiceReady() ? play : `/games/lis-dis/voix?suite=${encodeURIComponent(play)}`
}
</script>

<style scoped>
.voice {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-top: 14px;
  padding: 12px 14px;
  border: none;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  font-size: 15px;
  text-align: left;
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.06);
}
.voice small {
  margin-left: auto;
  color: var(--ion-color-primary);
  font-weight: 600;
}
</style>
