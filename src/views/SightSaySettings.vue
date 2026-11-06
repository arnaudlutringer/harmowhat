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
    :needs-online="recognition === 'google'"
  >
    <template #extra>
      <!-- Reconnaissance des notes dites : par le son (sur le téléphone, sans Internet) ou par Google. -->
      <h2 class="title">Reconnaissance</h2>
      <div class="chips" role="radiogroup" aria-label="Reconnaissance">
        <button role="radio" :aria-checked="recognition === 'son'" :class="{ on: recognition === 'son' }" @click="setRecognition('son')">Par le son</button>
        <button role="radio" :aria-checked="recognition === 'google'" :class="{ on: recognition === 'google' }" @click="setRecognition('google')">Google</button>
      </div>
      <p class="hint">
        {{ recognition === 'son' ? 'Sur le téléphone, d’après tes enregistrements : rapide, et sans Internet.' : 'Le service de Google : plus lent, et il faut Internet.' }}
      </p>
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
import { recognition, setRecognition, voiceReady, voiceWords } from '@/games/voiceWords'

const router = useIonRouter()
// Recalculé au retour de « Ma voix » (les enregistrements par le son sont sur l'appareil, pas réactifs).
const refresh = ref(0)
onIonViewWillEnter(() => refresh.value++)
const ready = computed(() => (refresh.value, recognition.value, voiceWords.value, voiceReady()))

/** Première partie : d'abord « Ma voix », qui ouvre ensuite la partie. */
function nextPath(s: { questions: number; level: string }) {
  const play = `/games/lis-dis/jouer?questions=${s.questions}&level=${s.level}`
  return voiceReady() ? play : `/games/lis-dis/voix?suite=${encodeURIComponent(play)}`
}
</script>

<style scoped>
/* Même présentation que les pastilles de l'écran de réglages. */
.title {
  margin: 18px 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
.chips {
  display: flex;
  gap: 8px;
}
.chips button {
  flex: 1;
  padding: 10px 4px;
  border: none;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.06);
}
.chips .on {
  background: var(--ion-color-primary);
  color: #fff;
  box-shadow: 0 6px 14px rgba(108, 92, 231, 0.35);
}
.hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--ion-color-medium);
}
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
