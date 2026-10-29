<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="tutorial hw-square" :class="{ closing }">
        <div class="top">
          <!-- Retour à l'étape précédente (ni sur la première, ni sur la dernière). -->
          <ion-button v-if="step > 1 && step < STEPS" fill="clear" size="small" class="previous" @click="previous">
            <ion-icon slot="start" :icon="chevronBack" />
            Précédent
          </ion-button>
          <!-- Avancement : une pastille par étape. -->
          <div class="dots" aria-hidden="true">
            <span v-for="n in STEPS" :key="n" :class="{ on: n <= step }" />
          </div>
        </div>

        <transition name="step" mode="out-in">
          <section :key="step" class="step">
            <!-- 1. Bienvenue -->
            <template v-if="step === 1">
              <img class="logo" src="/logo.svg" alt="" />
              <p class="lead">Bienvenue sur <strong>L'Oreille</strong>, l'application de ceux qui croient avoir l'oreille absolue.</p>
              <p class="lead">C'est ton cas ?</p>
              <ion-button expand="block" size="large" @click="next">Voyons ça !</ion-button>
            </template>

            <!-- 2. Les jeux -->
            <template v-else-if="step === 2">
              <div class="big" aria-hidden="true">🎹🎼🎵👀</div>
              <div class="lines">
                <p class="lead">Plein de mini-jeux sont là pour tester ton oreille, mais pas que&nbsp;!</p>
                <p class="lead">Harmonie, Accords, Tonalités... Pour tout niveau, teste ton talent musical.</p>
              </div>
              <ion-button expand="block" size="large" @click="next">Suivant</ion-button>
            </template>

            <!-- 3. Le diapason -->
            <template v-else-if="step === 3">
              <div class="fork-wrap">
                <button class="play fork" :class="{ 'is-playing': sound.current.value === 'fork' }" aria-label="Écouter le diapason, La3 440 Hz" @click="listenFork">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 2v8a4 4 0 0 0 8 0V2" />
                    <path d="M12 14v8" />
                  </svg>
                </button>
                <!-- Un doigt, en haut à droite, pointe le diapason vers le bas et la gauche, jusqu'au premier appui. -->
                <span v-if="!forkTried" class="pointer" aria-hidden="true">👇</span>
              </div>
              <p class="lead">
                Bien sûr, le diapason est là pour t'aider !<br />
                <strong class="hint">(clique dessus)</strong><br />
                À moins que tu sois vraiment sûr de toi…
              </p>
              <!-- « Suivant » ne s'ouvre qu'après avoir essayé le diapason. -->
              <ion-button expand="block" size="large" :disabled="!forkTried" @click="next">Suivant</ion-button>
            </template>

            <!-- 4. L'instrument -->
            <template v-else-if="step === 4">
              <p class="lead">Quel est ton instrument de prédilection ?</p>
              <div class="list">
                <div v-for="inst in INSTRUMENTS" :key="inst.id" class="row">
                  <ion-button class="main" @click="pickInstrument(inst.id)">{{ inst.emoji }} {{ inst.label }}</ion-button>
                  <button
                    class="listen"
                    :class="{ 'is-playing': sound.current.value === inst.id }"
                    :aria-label="`Écouter ${inst.label.toLowerCase()}`"
                    @click="listenInstrument(inst.id)"
                  >
                    <ion-icon :icon="sound.current.value === inst.id ? stop : play" />
                  </button>
                </div>
              </div>
            </template>

            <!-- 5. Le morceau -->
            <template v-else-if="step === 5">
              <p class="lead">Quel est ton morceau favori parmi ceux-là ?</p>
              <div class="list">
                <div v-for="e in endingsFor(selectedInstrument)" :key="e.id" class="row">
                  <ion-button class="main" @click="pickEnding(e.id)">
                    <span class="piece">{{ e.title }} <small>{{ e.composer }}</small></span>
                  </ion-button>
                  <button
                    class="listen"
                    :class="{ 'is-playing': sound.current.value === e.id }"
                    :aria-label="`Écouter ${e.title}`"
                    @click="listenEnding(e, e.id)"
                  >
                    <ion-icon :icon="sound.current.value === e.id ? stop : play" />
                  </button>
                </div>
              </div>
            </template>

            <!-- 6. Bien joué… ou la catastrophe -->
            <template v-else-if="step === 6">
              <p class="lead">À chaque jeu, fais en sorte que ton morceau soit bien joué à la fin !</p>
              <div class="row single">
                <span class="piece">{{ ending.title }} <small>{{ ending.composer }}</small></span>
                <button class="listen" :class="{ 'is-playing': sound.current.value === 'clean' }" aria-label="Écouter le morceau bien joué" @click="listenEnding(ending, 'clean')">
                  <ion-icon :icon="sound.current.value === 'clean' ? stop : play" />
                </button>
              </div>
              <p class="lead">Sinon ce sera la catastrophe…</p>
              <div class="row single disaster">
                <span class="piece">{{ ending.title }} <small>5 bonnes réponses sur 10</small></span>
                <button class="listen" :class="{ 'is-playing': sound.current.value === 'drunk' }" aria-label="Écouter le morceau mal joué" @click="listenDrunk">
                  <ion-icon :icon="sound.current.value === 'drunk' ? stop : play" />
                </button>
              </div>
              <ion-button expand="block" size="large" @click="next">Suivant</ion-button>
            </template>

            <!-- 7. C'est parti -->
            <template v-else>
              <div class="big" aria-hidden="true">🏆</div>
              <p class="lead">Maintenant tu es prêt !</p>
              <ion-button expand="block" size="large" @click="finish">C'est parti</ion-button>
            </template>
          </section>
        </transition>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonButton, IonContent, IonIcon, IonPage, onIonViewWillLeave, useIonRouter } from '@ionic/vue'
import { chevronBack, play, stop } from 'ionicons/icons'
import { playSequence, playTuningFork, stopAll } from '@/audio/engine'
import { INSTRUMENTS, selectedInstrument, setInstrument, type InstrumentId } from '@/audio/instruments'
import { usePlaying } from '@/composables/usePlaying'
import { chooseEnding, endingFor, endingsFor, playEnding, type Ending, type EndingId } from '@/music/endings'
import { markTutorialDone } from '@/tutorial'

const STEPS = 7
const step = ref(1)
const closing = ref(false)
const router = useIonRouter()
const sound = usePlaying<string>()
const ending = computed(() => endingFor(selectedInstrument.value))

function next() {
  stopAll()
  step.value = Math.min(STEPS, step.value + 1)
}

function previous() {
  stopAll()
  step.value = Math.max(1, step.value - 1)
}

/** Un appui écoute, un second appui sur le même bouton arrête. */
function toggle(key: string, start: () => Promise<number>) {
  const wasPlaying = sound.current.value === key
  stopAll()
  if (!wasPlaying) sound.track(start(), key).catch(() => {})
}

/** Le diapason a été essayé : le doigt qui le montre disparaît. */
const forkTried = ref(false)

function listenFork() {
  forkTried.value = true
  toggle('fork', playTuningFork)
}

/** Un petit arpège au milieu de la tessiture, pour entendre l'instrument. */
function listenInstrument(id: InstrumentId) {
  const inst = INSTRUMENTS[id]
  const root = Math.round((inst.low + inst.high) / 2) - 6
  const arpeggio = [0, 4, 7, 12, 7, 4, 0].map((d, i) => ({ midi: root + d, at: i, len: i === 6 ? 3 : 1.2 }))
  toggle(id, () => playSequence(arpeggio, 0.22, undefined, inst).then((p) => p.duration))
}

function listenEnding(e: Ending, key: string) {
  toggle(key, () => playEnding(e, selectedInstrument.value))
}

// Le même morceau joué comme après une partie à 5 bonnes réponses sur 10 (voir music/drunk.ts).
function listenDrunk() {
  toggle('drunk', () => playEnding(ending.value, selectedInstrument.value, 0.5))
}

function pickInstrument(id: InstrumentId) {
  setInstrument(id)
  chooseEnding(id, endingsFor(id)[0].id)
  next()
}

function pickEnding(id: EndingId) {
  chooseEnding(selectedInstrument.value, id)
  next()
}

// « C'est parti » : le tutoriel s'efface en fondu, puis l'accueil.
function finish() {
  stopAll()
  markTutorialDone()
  closing.value = true
  setTimeout(() => router.navigate('/home', 'root', 'replace'), 600)
}

onIonViewWillLeave(stopAll)
</script>

<style scoped>
.tutorial {
  max-width: 440px;
  min-height: 85vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  transition: opacity 0.6s ease;
}
.tutorial.closing {
  opacity: 0;
}
/* En haut : « Précédent » à gauche, les pastilles d'avancement au centre. */
.top {
  position: relative;
  min-height: 36px;
  margin: 0 0 16px;
}
.previous {
  position: absolute;
  left: -8px;
  top: 0;
  margin: 0;
  text-transform: none;
  --color: var(--ion-color-primary);
  --background: transparent;
  --background-activated: transparent;
  --box-shadow: none;
}
.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 14px;
}
.dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(var(--ion-color-primary-rgb), 0.2);
  transition: background 0.3s;
}
.dots span.on {
  background: var(--ion-color-primary);
}
.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  text-align: center;
}
.step > ion-button {
  width: 100%;
  margin-top: 16px;
}
.logo {
  width: 96px;
  height: 96px;
}
.big {
  font-size: 48px;
}
.lead {
  margin: 0;
  font-size: 20px;
  line-height: 1.4;
}
/* Deux phrases bien séparées. */
.lines {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.lead strong {
  font-family: 'Dancing Script', cursive;
  font-size: 28px;
  color: var(--ion-color-primary);
}
/* « (clique dessus) » : en gras, un peu plus petit, sans la police du nom de l'appli. */
.lead .hint {
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  color: inherit;
}
.fork-wrap {
  position: relative;
}
/* Doigt vers le bas tourné de 45° : il pointe vers le bas et la gauche, et s'avance vers le bouton. */
.pointer {
  position: absolute;
  top: -34px;
  right: -46px;
  font-size: 44px;
  line-height: 1;
  pointer-events: none;
  animation: point 1s ease-in-out infinite;
}
@keyframes point {
  0%,
  100% {
    transform: rotate(45deg) translate(0, 0);
  }
  50% {
    transform: rotate(45deg) translate(0, 8px);
  }
}
.fork {
  width: 120px;
  height: 120px;
  display: grid;
  place-items: center;
}
.fork svg {
  width: 60px;
  height: 60px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.row .main {
  flex: 1;
  margin: 0;
  text-transform: none;
  --padding-start: 12px;
}
.row.single {
  width: 100%;
  padding: 10px 12px;
  background: var(--hw-button);
  box-shadow: 0 2px 0 rgba(108, 92, 231, 0.35), 0 4px 10px rgba(45, 48, 71, 0.08);
  text-align: left;
}
.row.single .piece {
  flex: 1;
}
.row.disaster {
  background: #ffe8e8;
}
.piece small {
  display: block;
  opacity: 0.7;
  font-size: 12px;
}
.listen {
  flex: none;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 20px;
  color: #fff;
  background: var(--ion-color-primary);
  cursor: pointer;
}
/* Passage d'une étape à l'autre : fondu avec un léger glissement. */
.step-enter-active,
.step-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
