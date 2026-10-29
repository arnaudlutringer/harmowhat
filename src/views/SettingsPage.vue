<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Paramètres" back-href="/home" />
      <!-- Deux onglets : l'instrument (et sa musique de fin), Mon compte (nom et pays du joueur). -->
      <ion-segment :value="tab" class="tabs" @ion-change="switchTab($event.detail.value as Tab)">
        <ion-segment-button value="instrument">
          <ion-label>{{ instrument.emoji }} Instrument</ion-label>
        </ion-segment-button>
        <ion-segment-button value="joueur">
          <ion-label>{{ flag(profile.country) }} Mon compte</ion-label>
        </ion-segment-button>
      </ion-segment>

      <player-settings v-if="tab === 'joueur'" class="settings" />
      <div v-else class="settings hw-square">
        <!-- Changement en deux écrans, comme dans le tutoriel : l'instrument, puis le morceau. -->
        <template v-if="picking === 'instrument'">
          <button class="back" @click="cancel"><ion-icon :icon="chevronBack" aria-hidden="true" /> Annuler</button>
          <p class="lead">Quel est ton instrument de prédilection ?</p>
          <p class="how">Touche un instrument pour le choisir, ou <ion-icon :icon="play" aria-label="le bouton lecture" /> pour l'écouter d'abord.</p>
          <div class="list">
            <choice-row
              v-for="inst in INSTRUMENTS"
              :key="inst.id"
              :listen-label="`Écouter ${inst.label.toLowerCase()}`"
              :playing="preview.current.value === inst.id"
              @pick="choose(inst.id)"
              @listen="listen(inst.id, () => playArpeggio(inst))"
            >
              {{ inst.emoji }} {{ inst.label }}
            </choice-row>
          </div>
        </template>

        <template v-else-if="picking === 'piece'">
          <button class="back" @click="showStep('instrument')"><ion-icon :icon="chevronBack" aria-hidden="true" /> Instrument</button>
          <p class="lead">Quel est ton morceau favori parmi ceux-là ?</p>
          <p class="how">Touche un morceau pour le choisir, ou <ion-icon :icon="play" aria-label="le bouton lecture" /> pour l'écouter d'abord.</p>
          <div class="list">
            <choice-row
              v-for="e in endingsFor(selectedInstrument)"
              :key="e.id"
              :listen-label="`Écouter ${e.title}`"
              :playing="preview.current.value === e.id"
              @pick="pickEnding(e.id)"
              @listen="listenEnding(e)"
            >
              <span class="piece">{{ e.title }} <small>{{ e.composer }}</small></span>
            </choice-row>
          </div>
        </template>

        <template v-else>
          <!-- En tête : l'instrument et le morceau choisis, avec de quoi écouter le morceau. -->
          <section class="current">
            <div class="current-text">
              <span class="current-label">Ton choix</span>
              <strong>{{ instrument.emoji }} {{ instrument.label }}</strong>
              <span class="piece">{{ ending.title }}</span>
              <small class="composer">{{ ending.composer }}</small>
            </div>
            <button
              class="listen"
              :class="{ 'is-playing': preview.current.value === 'current' }"
              :aria-label="`Écouter ${ending.title}`"
              @click="listenEnding(ending, 'current')"
            >
              <ion-icon :icon="preview.current.value === 'current' ? stop : play" />
            </button>
          </section>
          <ion-button expand="block" class="change" @click="startChange">Changer d'instrument</ion-button>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonButton, IonContent, IonIcon, IonLabel, IonPage, IonSegment, IonSegmentButton, onIonViewWillEnter, onIonViewWillLeave,
} from '@ionic/vue'
import { chevronBack, play, stop } from 'ionicons/icons'
import PageNav from '@/components/PageNav.vue'
import PlayerSettings from '@/components/PlayerSettings.vue'
import ChoiceRow from '@/components/ChoiceRow.vue'
import { flag } from '@/player/countries'
import { profile } from '@/player/profile'
import { INSTRUMENTS, selectedInstrument, setInstrument, type InstrumentId } from '@/audio/instruments'
import { playArpeggio, preloadPiano, stopAll } from '@/audio/engine'
import { usePlaying } from '@/composables/usePlaying'
import { chooseEnding, chosenEndings, endingFor, endingsFor, playEnding, type Ending, type EndingId } from '@/music/endings'
import { trophyEvent } from '@/games/trophies'

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

/** Écran du changement d'instrument en cours, ou null pour le choix actuel. */
const picking = ref<'instrument' | 'piece' | null>(null)

function showStep(step: 'instrument' | 'piece' | null) {
  stopAll()
  picking.value = step
}

// Annuler revient au choix d'avant, retenu à l'ouverture du changement.
let before: { instrument: InstrumentId; ending: EndingId } | null = null
function startChange() {
  before = { instrument: selectedInstrument.value, ending: ending.value.id }
  showStep('instrument')
}

function cancel() {
  if (before) {
    setInstrument(before.instrument)
    chooseEnding(before.instrument, before.ending)
  }
  showStep(null)
}

// Nouvel instrument : sa première musique de fin est choisie, ses sons se chargent, puis vient le choix du morceau.
function choose(id: InstrumentId) {
  setInstrument(id)
  chooseEnding(id, endingsFor(id)[0].id)
  void preloadPiano().catch(() => undefined)
  showStep('piece')
}

function pickEnding(id: EndingId) {
  chooseEnding(selectedInstrument.value, id)
  before = null
  showStep(null)
}

// Un appui sur ▶ fait écouter (l'instrument ou le morceau) ; un second appui l'arrête.
const preview = usePlaying<string>()

function listen(key: string, start: () => Promise<number>) {
  const wasPlaying = preview.current.value === key
  stopAll()
  if (!wasPlaying) preview.track(start(), key).catch(() => {})
}

// Écouter un morceau de fin compte pour le trophée « Mélomane ».
function listenEnding(e: Ending, key: string = e.id) {
  if (preview.current.value !== key) trophyEvent({ type: 'ending', instrument: selectedInstrument.value, id: e.id })
  listen(key, () => playEnding(e, selectedInstrument.value))
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
/* Choix actuel, en tête de l'onglet, avec le bouton d'écoute du morceau à droite. */
.current {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--hw-button-active);
  border-left: 4px solid var(--ion-color-primary);
}
.current-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.listen {
  flex: none;
  width: 44px;
  height: 44px;
  border: 2px solid var(--ion-color-primary);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 20px;
  color: var(--ion-color-primary);
  background: transparent;
  cursor: pointer;
}
.listen.is-playing {
  border-color: var(--ion-color-secondary);
}
.change {
  margin-top: 16px;
}
/* Écrans du changement : retour, question et consigne, comme dans le tutoriel. */
.back {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin: 12px 0 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--ion-color-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.lead {
  margin: 16px 0 4px;
  font-size: 20px;
  line-height: 1.4;
  text-align: center;
}
.how {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--ion-color-medium);
  text-align: center;
}
.current-label {
  font-size: 12px;
  color: var(--ion-color-medium);
}
.current strong {
  font-size: 20px;
}
.composer {
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
