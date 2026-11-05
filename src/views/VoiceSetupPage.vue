<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Ma voix" back-href="/games/lis-dis" />
      <div class="voice">
        <template v-if="step < prompts.length">
          <p class="how">
            Dis chaque mot quand il s'affiche, normalement.
            {{ bySound ? 'L’appli enregistre le son de ta voix pour reconnaître les notes pendant « Lecture continue », sans Internet.' : 'L’appli retient comment la reconnaissance vocale comprend ta voix, pour mieux te comprendre pendant « Lecture continue ».' }}
          </p>
          <p v-if="!bySound && !online" class="error">📶 Connecte-toi à Internet : la reconnaissance vocale en a besoin.</p>
          <p class="progress">Mot {{ step + 1 }} / {{ prompts.length }}</p>
          <p class="word" aria-live="polite">{{ prompts[step].label }}</p>
          <p class="state" :class="feedback?.kind">{{ feedback?.text ?? (listening ? 'Je t’écoute…' : ' ') }}</p>
          <div v-if="bySound && listening" class="level" aria-hidden="true"><span :style="{ width: `${level * 100}%` }" /></div>
          <div class="buttons">
            <ion-button v-if="!listening" :disabled="!bySound && !online" @click="start">Commencer</ion-button>
            <ion-button v-else fill="outline" @click="skip">Passer ce mot</ion-button>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
        </template>

        <template v-else>
          <h2>C'est enregistré ✓</h2>
          <p class="how">{{ bySound ? 'Tes enregistrements serviront à reconnaître les notes que tu dis.' : 'Voici ce que la reconnaissance vocale a compris. Les mots écrits autrement seront acceptés pour la bonne note.' }}</p>
          <ul class="summary">
            <li v-for="w in VOICE_WORDS" :key="w.key">
              <strong>{{ w.label }}</strong>
              <span>{{ summaryOf(w.key) }}</span>
            </li>
          </ul>
          <div class="buttons">
            <ion-button v-if="suite" @click="play">Jouer</ion-button>
            <ion-button v-else @click="router.navigate('/games/lis-dis', 'back', 'replace')">Terminé</ion-button>
            <ion-button fill="outline" @click="restart">Recommencer</ion-button>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton, IonContent, IonPage, onIonViewWillLeave, useIonRouter } from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import { listenToSpeech, type SpeechEvent, type SpeechListening } from '@/audio/speech'
import { recognition, saveVoiceWords, toLearn, VOICE_TAKES, VOICE_WORDS, type VoiceWord } from '@/games/voiceWords'
import { listenToSyllables, loadTemplates, MIN_VOICED_MS, saveTemplates, type Features, type Syllable, type SyllableListening } from '@/audio/wordMatch'
import { spokenWords } from '@/games/sightReading'
import { online } from '@/player/online'

const route = useRoute()
const router = useIonRouter()
/** Écran à ouvrir ensuite (la partie demandée), avec l'essai s'il en est un. */
const suite = typeof route.query.suite === 'string' && route.query.suite.startsWith('/games/') ? route.query.suite : ''

/** Par le son : on enregistre la voix elle-même (trois fois chaque mot) ; sinon, ce que Google en comprend. */
const bySound = recognition.value === 'son'
const SOUND_TAKES = 3
/** Chaque mot, plusieurs fois. */
const prompts: VoiceWord[] = VOICE_WORDS.flatMap((w) => Array.from({ length: bySound ? SOUND_TAKES : VOICE_TAKES }, () => w))
const level = ref(0)
/** Enregistrements par le son, par syllabe. */
const sounds: Record<string, Features[]> = {}
let syllables: SyllableListening | null = null
const step = ref(0)
const listening = ref(false)
const feedback = ref<{ kind: 'ok' | 'ko'; text: string } | null>(null)
const error = ref('')
/** Ce que la reconnaissance a écrit pour chaque syllabe. */
const heard: Record<string, string[]> = {}
let speech: SpeechListening | null = null
/** Pause après un mot entendu, avant le suivant : on ignore ce qui arrive pendant ce temps. */
let waiting = false
/** Dernier résultat partiel de la phrase en cours (si la phrase finit sans résultat final). */
let partial = ''

function stopListening() {
  speech?.stop()
  speech = null
  syllables?.stop()
  syllables = null
  level.value = 0
  listening.value = false
}

function take(text: string) {
  if (waiting || step.value >= prompts.length) return
  const word = prompts[step.value]
  const said = text.trim()
  if (!said) return
  ;(heard[word.key] ??= []).push(said)
  const exact = spokenWords(said).join(' ') === word.key
  feedback.value = { kind: 'ok', text: `Entendu : « ${said} »${exact ? ' ✓' : ''}` }
  next()
}

function next() {
  waiting = true
  partial = ''
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

function onSpeech(text: string, _session: number, final: boolean) {
  if (final) take(text)
  else partial = text
}

function onEvent(e: SpeechEvent) {
  // Phrase finie sans résultat final : on garde le dernier résultat partiel ; rien du tout : on redemande.
  if (e.type !== 'error' || waiting) return
  if (partial) return take(partial)
  if (e.message === 'rien compris') feedback.value = { kind: 'ko', text: `Je n'ai pas compris, redis « ${prompts[step.value]?.label} ».` }
}

/** Par le son : la première syllabe avec de la voix (pas un souffle) est l'enregistrement du mot. */
function onSyllable(s: Syllable) {
  if (waiting || step.value >= prompts.length || s.voiced < MIN_VOICED_MS) return
  ;(sounds[prompts[step.value].key] ??= []).push(s.features)
  feedback.value = { kind: 'ok', text: 'Enregistré ✓' }
  next()
}

async function start() {
  error.value = ''
  listening.value = true
  try {
    if (bySound) syllables = await listenToSyllables(onSyllable, (l) => (level.value = l))
    else speech = await listenToSpeech(onSpeech, onEvent)
  } catch {
    listening.value = false
    error.value = 'La reconnaissance vocale n’est pas accessible : autorise le micro pour cette appli, puis réessaie.'
  }
}

/** Transcriptions retenues : celles qu'on ne comprenait pas déjà, et pas pour deux syllabes à la fois. */
function learnedWords(): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const [key, texts] of Object.entries(heard)) {
    const list = texts.map(toLearn).filter((t): t is string => !!t)
    if (list.length) out[key] = [...new Set(list)]
  }
  const owners = new Map<string, string[]>()
  for (const [key, list] of Object.entries(out)) for (const t of list) owners.set(t, [...(owners.get(t) ?? []), key])
  for (const [key, list] of Object.entries(out)) out[key] = list.filter((t) => owners.get(t)?.length === 1)
  return out
}

let saved: Record<string, string[]> = {}
function finish() {
  stopListening()
  if (bySound) {
    // Les mots passés gardent leurs enregistrements précédents.
    saveTemplates({ ...loadTemplates(), ...sounds })
    return
  }
  saved = learnedWords()
  saveVoiceWords(saved)
}

function summaryOf(key: string): string {
  if (bySound) {
    const n = sounds[key]?.length ?? 0
    return n ? `${n} enregistrement${n > 1 ? 's' : ''}` : 'passé (enregistrements précédents gardés)'
  }
  const texts = heard[key] ?? []
  if (!texts.length) return 'passé'
  const extra = saved[key] ?? []
  return extra.length ? `compris « ${extra.join(' », « ')} » : accepté désormais` : 'bien compris'
}

function restart() {
  for (const k of Object.keys(heard)) delete heard[k]
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
