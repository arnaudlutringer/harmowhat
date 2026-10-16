<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Paramètres" back-href="/home" />
      <!-- Deux onglets : l'instrument (et sa musique de fin), Mon compte (nom et pays du joueur). -->
      <ion-segment :value="tab" class="tabs" @ion-change="switchTab($event.detail.value as Tab)">
        <ion-segment-button value="instrument">
          <ion-label>🎻 Instrument</ion-label>
        </ion-segment-button>
        <ion-segment-button value="joueur">
          <ion-label>{{ flag(profile.country) }} Mon compte</ion-label>
        </ion-segment-button>
      </ion-segment>

      <player-settings v-if="tab === 'joueur'" class="settings" />
      <div v-else class="settings">
        <h2>Instrument</h2>
        <p class="hint">Il joue les notes et les accords de tous les jeux. Les questions restent dans sa tessiture.</p>
        <ion-radio-group :value="selectedInstrument" @ion-change="choose($event.detail.value)">
          <div v-for="inst in INSTRUMENTS" :key="inst.id" class="instrument">
            <ion-item lines="none">
              <ion-radio :value="inst.id" justify="space-between">
                <ion-label>
                  <strong>{{ inst.emoji }} {{ inst.label }}</strong>
                  <p>De {{ noteName(inst.low) }} à {{ noteName(inst.high) }}</p>
                </ion-label>
              </ion-radio>
            </ion-item>
            <!-- Musique de fin de partie, pour l'instrument sélectionné seulement : un ou plusieurs morceaux au choix. -->
            <div v-if="inst.id === selectedInstrument" class="endings" role="radiogroup" :aria-label="`Musique préférée : ${inst.label}`">
              <span class="endings-label">Musique préférée</span>
              <button
                v-for="e in endingsFor(inst.id)"
                :key="e.id"
                class="ending"
                :class="{ chosen: endingFor(inst.id, chosenEndings).id === e.id, 'is-playing': preview.current.value === `${inst.id}/${e.id}` }"
                role="radio"
                :aria-checked="endingFor(inst.id, chosenEndings).id === e.id"
                @click="pickEnding(inst.id, e)"
              >
                <ion-icon :icon="preview.current.value === `${inst.id}/${e.id}` ? stop : play" aria-hidden="true" />
                {{ e.title }} <small>{{ e.composer }}</small>
              </button>
            </div>
          </div>
        </ion-radio-group>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonContent, IonIcon, IonItem, IonLabel, IonPage, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton, onIonViewWillEnter,
  onIonViewWillLeave,
} from '@ionic/vue'
import { play, stop } from 'ionicons/icons'
import PageNav from '@/components/PageNav.vue'
import PlayerSettings from '@/components/PlayerSettings.vue'
import { flag } from '@/player/countries'
import { profile } from '@/player/profile'
import { INSTRUMENTS, selectedInstrument, setInstrument, type InstrumentId } from '@/audio/instruments'
import { playPiano, playSequence, preloadPiano, stopAll } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'
import { A440, noteName } from '@/music/notes'
import { chooseEnding, chosenEndings, endingFor, endingsFor, type Ending } from '@/music/endings'

// Onglet ouvert : celui demandé par le lien (?onglet=joueur, depuis l'accueil ou la fin de partie), sinon l'instrument.
type Tab = 'instrument' | 'joueur'
const route = useRoute()
const tabFromRoute = (): Tab => (route.query.onglet === 'joueur' ? 'joueur' : 'instrument')
const tab = ref<Tab>(tabFromRoute())
onIonViewWillEnter(() => (tab.value = tabFromRoute()))

// Changer d'onglet coupe le morceau en cours d'écoute.
function switchTab(next: Tab) {
  stopAll()
  tab.value = next
}

// Le joueur entend tout de suite le nouvel instrument (La3 du diapason) ; sa première musique de fin est choisie.
function choose(id: InstrumentId) {
  stopAll()
  setInstrument(id)
  chooseEnding(id, endingsFor(id)[0].id)
  void playPiano(A440, { duration: 1.5 })
  void preloadPiano().catch(() => undefined)
}

// Un appui sur un morceau le choisit et le fait écouter, joué par son instrument ; un second appui l'arrête.
const preview = usePlaying<string>()

function pickEnding(instrument: InstrumentId, ending: Ending) {
  const key = `${instrument}/${ending.id}`
  const wasPlaying = preview.current.value === key
  stopAll()
  chooseEnding(instrument, ending.id)
  if (wasPlaying) return
  preview.track(playSequence(ending.notes, ending.unit, undefined, INSTRUMENTS[instrument]).then((p) => p.duration), key).catch(() => {})
}

onIonViewWillLeave(stopAll)
</script>

<style scoped>
.settings {
  display: block;
  max-width: 480px;
  margin: 0 auto;
}
.tabs {
  max-width: 480px;
  margin: 16px auto 8px;
}
.tabs ion-label {
  text-transform: none;
}
h2 {
  font-size: 18px;
  margin: 24px 0 8px;
}
.hint,
ion-label p {
  color: var(--ion-color-medium);
}
ion-radio {
  width: 100%;
}
.instrument {
  border-bottom: 1px solid rgba(var(--ion-text-color-rgb), 0.1);
  padding-bottom: 10px;
}
.endings {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
}
.endings-label {
  width: 100%;
  font-size: 12px;
  color: var(--ion-color-medium);
}
.ending {
  padding: 6px 10px;
  border: 1px solid rgba(var(--ion-color-primary-rgb), 0.35);
  border-radius: 16px;
  background: transparent;
  color: var(--ion-color-primary);
  font-size: 13px;
  cursor: pointer;
}
.ending {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ending ion-icon {
  font-size: 14px;
}
.ending small {
  opacity: 0.7;
}
/* Pendant l'écoute : le morceau pulse, comme le bouton de lecture des jeux. */
.ending.is-playing {
  animation: listen 1s ease-out infinite;
}
@keyframes listen {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--ion-color-secondary-rgb), 0.6);
  }
  100% {
    box-shadow: 0 0 0 8px rgba(var(--ion-color-secondary-rgb), 0);
  }
}
.ending.chosen {
  background: var(--ion-color-primary);
  border-color: var(--ion-color-primary);
  color: #fff;
}
</style>
