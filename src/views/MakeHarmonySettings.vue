<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Fais l'harmonie" back-href="/home" />
      <div class="settings hw-square">
        <h2>Nombre de questions</h2>
        <ion-segment v-model="questions">
          <ion-segment-button v-for="n in QUESTION_COUNTS" :key="n" :value="n">
            <ion-label>{{ n }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <h2>Niveau</h2>
        <ion-radio-group v-model="level">
          <ion-item v-for="(cfg, key) in LEVELS" :key="key" lines="full">
            <ion-radio :value="key" justify="space-between">
              <ion-label class="ion-text-wrap">
                <strong>{{ cfg.label }}</strong>
                <p>{{ cfg.description }}</p>
              </ion-label>
            </ion-radio>
          </ion-item>
        </ion-radio-group>

        <ion-button expand="block" size="large" class="start" @click="start()">C'est parti&nbsp;!</ion-button>
        <ion-button expand="block" class="trial" @click="start(true)">Essayer une question</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { withTrial } from '@/games/ready'
import { ref } from 'vue'
import {
  IonButton, IonContent, IonItem, IonLabel, IonPage, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton, useIonRouter,
} from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import { LEVELS, parseSettings, QUESTION_COUNTS, type Level } from '@/games/makeHarmony'

const STORAGE_KEY = 'harmowhat.fais-harmonie.settings'

// On repropose les derniers réglages choisis.
function loadSaved() {
  try {
    return parseSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'))
  } catch {
    return parseSettings({})
  }
}

const saved = loadSaved()
const questions = ref<number>(saved.questions)
const level = ref<Level>(saved.level)
const router = useIonRouter()

function start(trial = false) {
  const settings = { questions: questions.value, level: level.value }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Stockage indisponible : on joue quand même.
  }
  router.push(withTrial(`/games/fais-harmonie/jouer?questions=${settings.questions}&level=${settings.level}`, trial))
}
</script>

<style scoped>
.settings {
  max-width: 480px;
  margin: 0 auto;
}
h2 {
  font-size: 18px;
  margin: 24px 0 12px;
}
ion-radio {
  width: 100%;
}
ion-radio::part(label) {
  white-space: normal;
}
ion-label p {
  color: var(--ion-color-medium);
}
.start {
  margin-top: 32px;
}
</style>
