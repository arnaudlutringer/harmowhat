<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav :title="title" back-href="/home" />
      <div class="settings hw-square">
        <h2>Nombre de questions</h2>
        <ion-segment v-model="questions">
          <ion-segment-button v-for="n in questionCounts" :key="n" :value="n">
            <ion-label>{{ n }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <h2>Niveau</h2>
        <ion-radio-group v-model="level">
          <ion-item v-for="(cfg, key) in levels" :key="key" lines="full">
            <ion-radio :value="key" justify="space-between">
              <ion-label class="ion-text-wrap">
                <strong>{{ cfg.label }}</strong>
                <p>{{ cfg.description }}</p>
              </ion-label>
            </ion-radio>
          </ion-item>
        </ion-radio-group>

        <ion-button expand="block" size="large" class="start" @click="start">Commencer</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButton, IonContent, IonItem, IonLabel, IonPage, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton, useIonRouter,
} from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'

/**
 * Écran de réglages d'un jeu : nombre de questions et niveau, mémorisés sur l'appareil,
 * puis « Commencer » ouvre le jeu avec ces réglages dans l'adresse.
 */
const props = defineProps<{
  title: string
  levels: Record<string, { label: string; description: string }>
  questionCounts: readonly number[]
  /** Clé de stockage des derniers réglages choisis. */
  storageKey: string
  /** Écran de jeu, qui reçoit `questions` et `level` dans l'adresse. */
  playPath: string
  /** Lit des réglages enregistrés (avec repli sur les valeurs par défaut). */
  parse: (raw: { questions?: unknown; level?: unknown }) => { questions: number; level: string }
}>()

// On repropose les derniers réglages choisis.
function loadSaved() {
  try {
    return props.parse(JSON.parse(localStorage.getItem(props.storageKey) ?? '{}'))
  } catch {
    return props.parse({})
  }
}

const saved = loadSaved()
const questions = ref<number>(saved.questions)
const level = ref<string>(saved.level)
const router = useIonRouter()

function start() {
  const settings = { questions: questions.value, level: level.value }
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(settings))
  } catch {
    // Stockage indisponible : on joue quand même.
  }
  router.push(`${props.playPath}?questions=${settings.questions}&level=${settings.level}`)
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
