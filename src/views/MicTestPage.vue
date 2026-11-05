<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Test du micro" />
      <div class="test">
        <p class="how">Dis le nom de la note écrite (« do », « fa dièse »…). Tout ce que fait la reconnaissance vocale s'affiche en dessous.</p>

        <div class="sheet">
          <chord-staff :notes="[note]" clef="treble" :label="`Note à dire : ${expected}`" />
        </div>
        <p class="expected">Note attendue : <strong>{{ expected }}</strong></p>

        <!-- La reconnaissance vocale passe par Internet : écoute bloquée hors connexion, réactivée dès son retour. -->
        <p v-if="!online" class="error">📶 Connecte-toi à Internet pour tester le micro : la reconnaissance vocale en a besoin.</p>
        <div class="buttons">
          <ion-button :color="listening ? 'medium' : 'primary'" :disabled="!online && !listening" @click="toggle">{{ listening ? 'Arrêter l’écoute' : 'Démarrer l’écoute' }}</ion-button>
          <ion-button fill="outline" @click="nextNote">Autre note</ion-button>
        </div>

        <p class="state">
          <span class="dot" :class="phase" /> {{ PHASES[phase] }}
          <small v-if="service"> · {{ service }}</small>
        </p>
        <!-- Niveau du micro (de −2 à 10 dB environ) : s'il ne bouge pas quand tu parles, le son n'arrive pas. -->
        <div class="level" aria-hidden="true"><span :style="{ width: `${levelWidth}%` }" /></div>

        <div v-if="heard.length" class="heard">
          <p v-for="(t, i) in heard" :key="i" :class="{ main: i === 0 }">« {{ t }} »</p>
        </div>
        <p v-if="verdict" class="verdict" :class="verdict.ok ? 'ok' : 'ko'">{{ verdict.text }}</p>
        <p v-if="error" class="error">{{ error }}</p>

        <!-- Notes enchaînées : « Lecture continue » en essai, en partant de ♩ = 120 (hors records et trophées). -->
        <h2>Enchaînement rapide</h2>
        <p class="how">Une partie d’essai de « Lecture continue » qui démarre à ♩ = {{ FAST_TRIAL_TEMPO }}, pour tester les notes dites à la suite.</p>
        <div class="buttons">
          <ion-button fill="outline" :disabled="!online" router-link="/games/lis-dis/jouer?questions=1&level=debutant&tempo=120&essai=1">Lecture à ♩ = {{ FAST_TRIAL_TEMPO }}</ion-button>
        </div>

        <sound-match-test ref="soundTest" :expected="pc" @start="listening && stop()" />

        <h2>
          Journal
          <button class="copy" @click="copyLog">{{ copied ? 'Copié ✓' : 'Copier' }}</button>
        </h2>
        <p v-if="services.length" class="services">Services installés : {{ services.join(' ; ') }}</p>
        <ol class="log">
          <li v-for="(line, i) in log" :key="i">{{ line }}</li>
        </ol>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { IonButton, IonContent, IonPage, onIonViewWillLeave } from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import ChordStaff from '@/components/ChordStaff.vue'
import SoundMatchTest from '@/components/SoundMatchTest.vue'
import { listenToSpeech, speechServices, type SpeechEvent, type SpeechListening } from '@/audio/speech'
import { pitchClassName, randomInt } from '@/music/notes'
import { spelledPitchName } from '@/music/spelling'
import { noteAt } from '@/games/readNote'
import { FAST_TRIAL_TEMPO, parseSpokenNotes } from '@/games/sightReading'
import { online } from '@/player/online'
// Mots appris de la voix du joueur (« Ma voix »).
import '@/games/voiceWords'

/**
 * Écran de test (interrupteur testMicro, voir config/features.ts) : une note à dire, et le détail de la
 * reconnaissance vocale (service utilisé, niveau du micro, textes reconnus, erreurs), pour comprendre pourquoi
 * « Lecture continue » n'entend pas une note.
 */

const PHASES = { off: 'Écoute arrêtée', starting: 'Démarrage…', ready: 'Prêt : parle', speaking: 'Tu parles…', thinking: 'Analyse…' } as const
type Phase = keyof typeof PHASES

/** Une note naturelle sur la portée en clé de sol (Mi4 à Fa5). */
const randomNote = () => noteAt(randomInt(2 + 7 * 4, 3 + 7 * 5), 0)
const note = shallowRef(randomNote())
const expected = computed(() => spelledPitchName(note.value))
const pc = computed(() => ((note.value.midi % 12) + 12) % 12)

const listening = ref(false)
const phase = ref<Phase>('off')
const service = ref('')
const services = ref<string[]>([])
const level = ref(-2)
const levelWidth = computed(() => Math.max(0, Math.min(100, ((level.value + 2) / 12) * 100)))
const heard = ref<string[]>([])
const verdict = ref<{ ok: boolean; text: string } | null>(null)
const error = ref('')
const log = ref<string[]>([])
const copied = ref(false)
let session: SpeechListening | null = null
let t0 = Date.now()

function write(line: string) {
  const s = ((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')
  log.value = [`${s} s  ${line}`, ...log.value].slice(0, 80)
}

function onEvent(e: SpeechEvent) {
  switch (e.type) {
    case 'info':
      if (e.service) service.value = e.service
      write(`service : ${e.service ?? '?'}`)
      break
    case 'ready':
      phase.value = 'ready'
      write('prêt à écouter')
      break
    case 'begin':
      phase.value = 'speaking'
      write('début de parole')
      break
    case 'end':
      phase.value = 'thinking'
      write('fin de parole')
      break
    case 'onset':
      write('attaque de la voix')
      break
    case 'level':
      level.value = e.db ?? -2
      break
    case 'partial':
    case 'final':
      write(`${e.type === 'final' ? 'résultat final' : 'résultat partiel'} : ${(e.texts ?? []).map((t) => `« ${t} »`).join(', ') || '(vide)'}`)
      break
    case 'error':
      phase.value = 'ready'
      write(`erreur : ${e.message ?? ''}${e.code !== undefined ? ` (${e.code})` : ''}`)
      break
  }
}

function onSpeech(text: string, _s: number, final: boolean, alternatives: string[] = [text]) {
  heard.value = alternatives
  const notes = alternatives.map(parseSpokenNotes).find((n) => n.length) ?? []
  const last = notes[notes.length - 1]
  if (!last) {
    verdict.value = { ok: false, text: `Aucun nom de note reconnu${final ? '' : ' (pour l’instant)'}.` }
    return
  }
  const ok = last.pc === pc.value
  verdict.value = { ok, text: ok ? `Compris : ${pitchClassName(last.pc)} ✓` : `Compris : ${pitchClassName(last.pc)}, au lieu de ${expected.value}` }
}

/** Essai « par le son » : arrêté quand la reconnaissance vocale démarre (un seul utilisateur du micro). */
const soundTest = ref<InstanceType<typeof SoundMatchTest> | null>(null)

async function start() {
  soundTest.value?.stop()
  error.value = ''
  phase.value = 'starting'
  listening.value = true
  t0 = Date.now()
  write('démarrage de l’écoute')
  try {
    session = await listenToSpeech(onSpeech, onEvent)
    if (!listening.value) stop()
  } catch (e) {
    error.value = `Impossible de démarrer : ${e instanceof Error ? e.message : String(e)}`
    write(error.value)
    listening.value = false
    phase.value = 'off'
  }
}

function stop() {
  session?.stop()
  session = null
  listening.value = false
  phase.value = 'off'
  level.value = -2
  write('écoute arrêtée')
}

function toggle() {
  if (listening.value) stop()
  else void start()
}

function nextNote() {
  let n = randomNote()
  while (n.midi % 12 === note.value.midi % 12) n = randomNote()
  note.value = n
  heard.value = []
  verdict.value = null
}

async function copyLog() {
  const text = [`Service : ${service.value}`, `Services installés : ${services.value.join(' ; ')}`, ...[...log.value].reverse()].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    error.value = 'Copie impossible : fais une capture d’écran du journal.'
  }
}

onMounted(async () => {
  services.value = await speechServices()
})
onIonViewWillLeave(() => listening.value && stop())
onBeforeUnmount(() => session?.stop())
</script>

<style scoped>
.test {
  max-width: 480px;
  margin: 0 auto;
}
.how {
  color: var(--ion-color-medium);
  font-size: 14px;
}
.sheet {
  max-width: 260px;
  margin: 8px auto;
  padding: 6px;
  background: #fffdf3;
  color: #222;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.expected {
  text-align: center;
  margin: 8px 0;
}
.expected strong {
  color: var(--ion-color-primary);
  font-size: 22px;
}
.buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.state {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 6px;
  font-weight: 600;
}
.state small {
  font-weight: 400;
  color: var(--ion-color-medium);
  word-break: break-all;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ion-color-medium);
}
.dot.ready {
  background: var(--ion-color-success);
}
.dot.speaking {
  background: var(--ion-color-danger);
}
.dot.thinking,
.dot.starting {
  background: var(--ion-color-warning);
}
.level {
  height: 8px;
  border-radius: 4px;
  background: rgba(108, 92, 231, 0.15);
  overflow: hidden;
}
.level span {
  display: block;
  height: 100%;
  background: var(--ion-color-primary);
  transition: width 0.1s linear;
}
.heard {
  margin-top: 10px;
}
.heard p {
  margin: 2px 0;
  color: var(--ion-color-medium);
  font-style: italic;
}
.heard p.main {
  font-size: 20px;
  color: var(--ion-text-color);
}
.verdict {
  font-weight: 700;
}
.verdict.ok {
  color: var(--ion-color-success);
}
.verdict.ko,
.error {
  color: var(--ion-color-danger);
}
h2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 0 6px;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
.copy {
  border: none;
  background: var(--hw-button);
  color: var(--ion-color-primary);
  padding: 4px 10px;
  border-radius: 8px;
  font-family: inherit;
}
.services {
  font-size: 11px;
  color: var(--ion-color-medium);
  word-break: break-all;
}
.log {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
}
</style>
