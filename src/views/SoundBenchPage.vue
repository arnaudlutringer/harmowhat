<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Banc d'essai" back-href="/debug/micro" />
      <div class="bench">
        <template v-if="phase === 'idle'">
          <p class="how">
            Dis chaque mot quand il s'affiche, comme en jeu, à ton rythme habituel. L'enregistrement dure environ {{ minutes }} minutes
            et ne s'arrête pas entre les mots : si tu en rates un, continue simplement.
          </p>
          <p class="how">Mets-toi au calme. À la fin, tu choisis où envoyer le fichier : il ne quitte le téléphone que si tu l'envoies.</p>
          <div class="buttons"><ion-button @click="start">Commencer</ion-button></div>
        </template>

        <template v-else-if="phase === 'running'">
          <p class="progress">{{ step < 0 ? 'Ne parle pas encore…' : `${step + 1} / ${BENCH_PROMPTS.length}` }}</p>
          <p class="word" :class="{ small: current && current.text.length > 12 }" aria-live="polite">{{ current?.text ?? '…' }}</p>
          <div class="time" aria-hidden="true"><span :key="step" :style="{ animationDuration: `${current?.ms ?? BENCH_LEAD_MS}ms` }" /></div>
          <div class="level" aria-hidden="true"><span :style="{ width: `${level * 100}%` }" /></div>
          <div class="buttons"><ion-button fill="outline" @click="cancel">Annuler</ion-button></div>
        </template>

        <template v-else>
          <h2>C'est enregistré ✓</h2>
          <p class="how">Fichier de {{ sizeMb }} Mo. Envoie-le dans ton dossier Google Drive « L'oreille APK », ou dans notre discussion.</p>
          <div class="buttons">
            <ion-button :disabled="sending" @click="send">{{ sending ? 'Préparation…' : 'Envoyer le fichier' }}</ion-button>
            <ion-button fill="outline" @click="phase = 'idle'">Recommencer</ion-button>
          </div>
        </template>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { IonButton, IonContent, IonPage, onIonViewWillLeave } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import PageNav from '@/components/PageNav.vue'
import { audioContext } from '@/audio/engine'
import { encodeWav } from '@/audio/wav'
import { SOUND_MIC } from '@/audio/wordMatch'
import { BENCH_LEAD_MS, BENCH_PROMPTS, benchDurationMs, type BenchFile, type BenchLabel } from '@/games/soundBench'

const minutes = Math.ceil(benchDurationMs() / 60000)
const phase = ref<'idle' | 'running' | 'done'>('idle')
const step = ref(-1)
const current = computed(() => BENCH_PROMPTS[step.value] ?? null)
const level = ref(0)
const error = ref('')
const sending = ref(false)
const file = shallowRef<Uint8Array | null>(null)
const sizeMb = computed(() => ((file.value?.length ?? 0) / 1048576).toFixed(1))

let stopCapture: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let chunks: Float32Array[] = []
let captured = 0
let rate = 48000
let labels: BenchLabel[] = []

/** Position dans l'enregistrement, en secondes : comptée sur le son reçu, pas sur l'horloge. */
const position = () => captured / rate

function stopAll() {
  clearTimeout(timer)
  stopCapture?.()
  stopCapture = null
  level.value = 0
}

function nextPrompt() {
  const previous = labels[labels.length - 1]
  if (previous) previous.end = position()
  step.value++
  const prompt = BENCH_PROMPTS[step.value]
  if (!prompt) return finish()
  labels.push({ kind: prompt.kind, text: prompt.text, start: position(), end: position() })
  timer = setTimeout(nextPrompt, prompt.ms)
}

function finish() {
  stopAll()
  const samples = new Float32Array(captured)
  let at = 0
  for (const c of chunks) {
    samples.set(c, at)
    at += c.length
  }
  chunks = []
  const meta: BenchFile = { date: new Date().toISOString(), build: __BUILD_TIME__, rate, labels }
  file.value = encodeWav(samples, rate, meta)
  phase.value = 'done'
}

async function start() {
  error.value = ''
  chunks = []
  captured = 0
  labels = []
  step.value = -1
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Micro indisponible')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: SOUND_MIC })
    const ctx = audioContext()
    rate = ctx.sampleRate
    const source = ctx.createMediaStreamSource(stream)
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    const mute = ctx.createGain()
    mute.gain.value = 0
    source.connect(processor)
    processor.connect(mute)
    mute.connect(ctx.destination)
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0)
      chunks.push(input.slice())
      captured += input.length
      let energy = 0
      for (let i = 0; i < input.length; i++) energy += input[i] * input[i]
      level.value = Math.min(1, Math.sqrt(energy / input.length) * 20)
    }
    stopCapture = () => {
      processor.onaudioprocess = null
      source.disconnect()
      processor.disconnect()
      mute.disconnect()
      stream.getTracks().forEach((t) => t.stop())
    }
    phase.value = 'running'
    timer = setTimeout(nextPrompt, BENCH_LEAD_MS)
  } catch {
    error.value = 'Micro inaccessible : autorise le micro pour cette appli.'
  }
}

function cancel() {
  stopAll()
  chunks = []
  phase.value = 'idle'
}

/** Écrit le fichier par morceaux : d'un seul bloc, il serait trop gros pour passer vers Android. */
async function writeNative(bytes: Uint8Array, path: string): Promise<string> {
  const size = 3 * 256 * 1024
  let uri = ''
  for (let at = 0; at < bytes.length; at += size) {
    const part = bytes.subarray(at, at + size)
    let binary = ''
    for (let i = 0; i < part.length; i += 8192) binary += String.fromCharCode(...part.subarray(i, i + 8192))
    const data = btoa(binary)
    if (at === 0) uri = (await Filesystem.writeFile({ path, data, directory: Directory.Cache })).uri
    else await Filesystem.appendFile({ path, data, directory: Directory.Cache })
  }
  return uri
}

async function send() {
  if (!file.value) return
  sending.value = true
  error.value = ''
  const name = `oreille-banc-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.wav`
  try {
    if (Capacitor.isNativePlatform()) {
      const uri = await writeNative(file.value, name)
      await Share.share({ files: [uri], dialogTitle: 'Envoyer le fichier' })
    } else {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([file.value.slice()], { type: 'audio/wav' }))
      link.download = name
      link.click()
      URL.revokeObjectURL(link.href)
    }
  } catch (e) {
    // Fermer le menu de partage sans choisir n'est pas une erreur.
    const message = e instanceof Error ? e.message : String(e)
    if (!/cancel/i.test(message)) error.value = `Envoi impossible : ${message}`
  } finally {
    sending.value = false
  }
}

onIonViewWillLeave(() => phase.value === 'running' && cancel())
onBeforeUnmount(stopAll)
</script>

<style scoped>
.bench {
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
  margin: 24px 0 0;
  font-weight: 600;
  color: var(--ion-color-medium);
}
.word {
  margin: 16px 0;
  font-size: 56px;
  font-weight: 800;
  color: var(--ion-color-primary);
}
.word.small {
  font-size: 34px;
}
.buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}
.time,
.level {
  height: 8px;
  margin: 8px 0;
  border-radius: 4px;
  background: rgba(108, 92, 231, 0.15);
  overflow: hidden;
}
.time span {
  display: block;
  height: 100%;
  background: var(--ion-color-medium);
  animation: fill linear forwards;
}
@keyframes fill {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
.level span {
  display: block;
  height: 100%;
  background: var(--ion-color-primary);
}
.error {
  color: var(--ion-color-danger);
}
</style>
