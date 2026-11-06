<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Ma voix" back-href="/games/lis-dis" />
      <div class="voice">
        <template v-if="step < prompts.length">
          <p class="how">
            Dis chaque mot quand il s'affiche, normalement. L'appli enregistre le son de ta voix pour reconnaître les notes pendant « Lecture continue », sans Internet.
          </p>
          <p class="progress">Mot {{ step + 1 }} / {{ prompts.length }}</p>
          <p class="word" aria-live="polite">{{ prompts[step].label }}</p>
          <p class="state" :class="feedback?.kind">{{ feedback?.text ?? (listening ? 'Je t’écoute…' : ' ') }}</p>
          <div v-if="listening" class="level" aria-hidden="true"><span :style="{ width: `${level * 100}%` }" /></div>
          <div class="buttons">
            <ion-button v-if="!listening" @click="start">Commencer</ion-button>
            <ion-button v-else fill="outline" @click="skip">Passer ce mot</ion-button>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
        </template>

        <template v-else>
          <div class="done">
            <p class="ready-icon" aria-hidden="true">{{ complete ? '🎉' : '🎤' }}</p>
            <h2>{{ complete ? 'Cette fois, tout est prêt' : 'Il manque encore des mots' }}</h2>
            <p v-if="!complete" class="how">Tu en as passé quelques-uns : recommence pour que le jeu connaisse toutes les notes.</p>
          </div>
          <!-- Mise au point : ce qui a été retenu pour chaque mot. -->
          <ul v-if="debug" class="summary">
            <li v-for="w in VOICE_WORDS" :key="w.key">
              <strong>{{ w.label }}</strong>
              <span>{{ summaryOf(w.key) }}</span>
            </li>
          </ul>
          <div class="buttons">
            <ion-button v-if="complete && suite" @click="play">C'est parti</ion-button>
            <ion-button v-else-if="complete" @click="router.navigate('/games/lis-dis', 'back', 'replace')">Terminé</ion-button>
            <ion-button :fill="complete ? 'outline' : 'solid'" @click="restart">Recommencer</ion-button>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { alertController, IonButton, IonContent, IonPage, onIonViewWillLeave, useIonRouter } from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import { markVoiceOwner, voiceOwnerChanged, voiceReady, VOICE_TAKES, VOICE_WORDS, type VoiceWord } from '@/games/voiceWords'
import { AMBIENT_MS, listenToSyllables, loadTemplates, MIN_VOICED_MS, saveTemplates, type Features, type Syllable, type SyllableListening } from '@/audio/wordMatch'
import { featureEnabled } from '@/config/features'

const route = useRoute()
const router = useIonRouter()
/** Écran à ouvrir ensuite (la partie demandée), avec l'essai s'il en est un. */
const suite = typeof route.query.suite === 'string' && route.query.suite.startsWith('/games/') ? route.query.suite : ''

/** Le nom du joueur a changé depuis le dernier enregistrement. */
const newPlayer = voiceOwnerChanged()
const debug = featureEnabled('testMicro')
/** Enregistrement terminé : la voix est prête pour jouer (aucun mot ne manque). */
const complete = ref(false)

// Enregistrement demandé avant de jouer : on prévient d'abord, et on rassure.
onMounted(async () => {
  if (!suite && !newPlayer) return
  const alert = await alertController.create({
    header: newPlayer ? '🎤 Tiens, un nouveau nom !' : '🎤 Un petit échauffement',
    message: newPlayer
      ? 'On ne s’est pas encore présentés : le jeu doit faire connaissance avec ta voix. Pas d’audition, promis : sept notes à dire, deux fois chacune. Moins d’une minute, et c’est gardé pour les prochaines fois !'
      : 'Avant de jouer, le jeu doit faire connaissance avec ta voix : il ne sait pas encore à quoi ressemble ton « do ». Pas d’audition, promis : sept notes à dire, deux fois chacune. Moins d’une minute, et c’est gardé pour les prochaines fois !',
    backdropDismiss: false,
    buttons: [{ text: 'Je me lance' }],
  })
  await alert.present()
})
/** Chaque mot, deux fois. */
const prompts: VoiceWord[] = VOICE_WORDS.flatMap((w) => Array.from({ length: VOICE_TAKES }, () => w))
const level = ref(0)
/** Enregistrements, par mot. */
const sounds: Record<string, Features[]> = {}
let syllables: SyllableListening | null = null
const step = ref(0)
const listening = ref(false)
const feedback = ref<{ kind: 'ok' | 'ko'; text: string } | null>(null)
const error = ref('')
/** Pause après un mot entendu, avant le suivant : on ignore ce qui arrive pendant ce temps. */
let waiting = false

function stopListening() {
  syllables?.stop()
  syllables = null
  level.value = 0
  listening.value = false
}

function next() {
  waiting = true
  setTimeout(() => {
    waiting = false
    feedback.value = null
    step.value++
    if (step.value >= prompts.length) finish()
  }, 900)
}

function skip() {
  feedback.value = { kind: 'ko', text: 'Mot passé.' }
  next()
}

/** La première syllabe avec de la voix (pas un souffle) est l'enregistrement du mot. */
function onSyllable(s: Syllable) {
  if (waiting || step.value >= prompts.length || s.voiced < MIN_VOICED_MS) return
  const prompt = prompts[step.value]
  ;(sounds[prompt.key] ??= []).push(s.features)
  feedback.value = { kind: 'ok', text: 'Enregistré ✓' }
  next()
}

async function start() {
  error.value = ''
  listening.value = true
  try {
    syllables = await listenToSyllables(onSyllable, (l) => (level.value = l))
    // Le bruit ambiant est mesuré au début : on demande le silence pendant ce temps.
    feedback.value = { kind: 'ko', text: 'Ne parle pas encore : je mesure le bruit autour de toi…' }
    setTimeout(() => (feedback.value = null), AMBIENT_MS)
  } catch {
    listening.value = false
    error.value = 'Le micro n’est pas accessible : autorise-le pour cette appli, puis réessaie.'
  }
}

function finish() {
  stopListening()
  // Les mots passés gardent leurs enregistrements précédents.
  // Autre joueur : les enregistrements du précédent ne sont pas gardés, même pour un mot passé.
  saveTemplates(newPlayer ? sounds : { ...loadTemplates(), ...sounds })
  markVoiceOwner()
  complete.value = voiceReady()
}

function summaryOf(key: string): string {
  const n = sounds[key]?.length ?? 0
  return n ? `${n} enregistrement${n > 1 ? 's' : ''}` : newPlayer ? 'passé' : 'passé (enregistrements précédents gardés)'
}

function restart() {
  for (const k of Object.keys(sounds)) delete sounds[k]
  step.value = 0
  feedback.value = null
  void start()
}

function play() {
  router.navigate(`${suite}${route.query.essai ? '&essai=1' : ''}`, 'forward', 'replace')
}

onIonViewWillLeave(stopListening)
onBeforeUnmount(stopListening)
</script>

<style scoped>
.voice {
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
}
.how {
  color: var(--ion-color-medium);
  font-size: 14px;
  text-align: left;
}
.progress {
  margin: 18px 0 0;
  color: var(--ion-color-medium);
  font-weight: 600;
}
.word {
  margin: 8px 0;
  font-size: 64px;
  font-weight: 800;
  color: var(--ion-color-primary);
}
.state {
  min-height: 24px;
  font-weight: 600;
  color: var(--ion-color-medium);
}
.state.ok {
  color: var(--ion-color-success);
}
.state.ko,
.error {
  color: var(--ion-color-danger);
}
.buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}
/* Niveau du micro : s'il ne bouge pas quand tu parles, le son n'arrive pas. */
.level {
  height: 8px;
  margin: 8px 0;
  border-radius: 4px;
  background: rgba(108, 92, 231, 0.15);
  overflow: hidden;
}
.level span {
  display: block;
  height: 100%;
  background: var(--ion-color-primary);
}
.done {
  margin-top: 40px;
}
.ready-icon {
  margin: 0;
  font-size: 64px;
}
.summary {
  list-style: none;
  padding: 0;
  text-align: left;
}
.summary li {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 12px;
  background: var(--hw-surface, #fff);
}
.summary strong {
  width: 52px;
}
.summary span {
  flex: 1;
  color: var(--ion-color-medium);
}
</style>
