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
      <div v-else class="settings hw-square">
        <!-- En tête : l'instrument et le morceau choisis. -->
        <section class="current">
          <span class="current-label">Ton choix</span>
          <strong>{{ instrument.emoji }} {{ instrument.label }}</strong>
          <span class="piece">{{ ending.title }} <small>{{ ending.composer }}</small></span>
          <small class="range">Joue de {{ noteName(instrument.low) }} à {{ noteName(instrument.high) }}, dans tous les jeux.</small>
        </section>

        <!-- Pour changer : les mêmes listes que dans le tutoriel, le choix actuel encadré de violet. -->
        <h2>Changer d'instrument</h2>
        <div class="list">
          <choice-row
            v-for="inst in INSTRUMENTS"
            :key="inst.id"
            :chosen="inst.id === selectedInstrument"
            :listen-label="`Écouter ${inst.label.toLowerCase()}`"
            :playing="preview.current.value === inst.id"
            @pick="choose(inst.id)"
            @listen="listen(inst.id, () => playArpeggio(inst))"
          >
            {{ inst.emoji }} {{ inst.label }}
          </choice-row>
        </div>

        <h2>Changer de morceau</h2>
        <p class="hint">La musique de fin de partie, jouée par ton instrument.</p>
        <div class="list">
          <choice-row
            v-for="e in endingsFor(selectedInstrument)"
            :key="e.id"
            :chosen="e.id === ending.id"
            :listen-label="`Écouter ${e.title}`"
            :playing="preview.current.value === e.id"
            @pick="chooseEnding(selectedInstrument, e.id)"
            @listen="listen(e.id, () => playEnding(e, selectedInstrument))"
          >
            <span class="piece">{{ e.title }} <small>{{ e.composer }}</small></span>
          </choice-row>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonContent, IonLabel, IonPage, IonSegment, IonSegmentButton, onIonViewWillEnter, onIonViewWillLeave,
} from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import PlayerSettings from '@/components/PlayerSettings.vue'
import ChoiceRow from '@/components/ChoiceRow.vue'
import { flag } from '@/player/countries'
import { profile } from '@/player/profile'
import { INSTRUMENTS, selectedInstrument, setInstrument, type InstrumentId } from '@/audio/instruments'
import { playArpeggio, preloadPiano, stopAll } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'
import { noteName } from '@/music/notes'
import { chooseEnding, chosenEndings, endingFor, endingsFor, playEnding } from '@/music/endings'

// Onglet ouvert : celui demandé par le lien (?onglet=joueur, depuis l'accueil ou la fin de partie), sinon l'instrument.
type Tab = 'instrument' | 'joueur'
const route = useRoute()
const tabFromRoute = (): Tab => (route.query.onglet === 'joueur' ? 'joueur' : 'instrument')
const tab = ref<Tab>(tabFromRoute())
onIonViewWillEnter(() => (tab.value = tabFromRoute()))

const instrument = computed(() => INSTRUMENTS[selectedInstrument.value])
const ending = computed(() => endingFor(selectedInstrument.value, chosenEndings.value))

// Changer d'onglet coupe le morceau en cours d'écoute.
function switchTab(next: Tab) {
  stopAll()
  tab.value = next
}

// Nouvel instrument : sa première musique de fin est choisie, et ses sons se chargent.
function choose(id: InstrumentId) {
  stopAll()
  setInstrument(id)
  chooseEnding(id, endingsFor(id)[0].id)
  void preloadPiano().catch(() => undefined)
}

// Un appui sur ▶ fait écouter (l'instrument ou le morceau) ; un second appui l'arrête.
const preview = usePlaying<string>()

function listen(key: string, start: () => Promise<number>) {
  const wasPlaying = preview.current.value === key
  stopAll()
  if (!wasPlaying) preview.track(start(), key).catch(() => {})
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
/* Choix actuel, en tête de l'onglet. */
.current {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--hw-button-active);
  border-left: 4px solid var(--ion-color-primary);
}
.current-label {
  font-size: 12px;
  color: var(--ion-color-medium);
}
.current strong {
  font-size: 20px;
}
.range {
  margin-top: 4px;
  color: var(--ion-color-medium);
}
h2 {
  font-size: 18px;
  margin: 24px 0 8px;
}
.hint {
  margin: -4px 0 8px;
  color: var(--ion-color-medium);
}
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.piece small {
  opacity: 0.7;
  font-size: 12px;
}
.list .piece small {
  display: block;
}
</style>
