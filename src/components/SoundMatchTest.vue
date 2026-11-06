<template>
  <!-- Essai : reconnaître les noms de notes au son de la voix du joueur, sans Internet (voir audio/wordMatch.ts). -->
  <section class="sound">
    <h2>Par le son (essai)</h2>
    <p class="how">
      Sans Internet : enregistre chaque nom de note (trois fois chacun), puis l'appli compare chaque syllabe
      que tu dis à tes enregistrements. La réponse est presque immédiate.
    </p>

    <template v-if="mode === 'record'">
      <p class="progress">Enregistrement {{ step + 1 }} / {{ prompts.length }}</p>
      <p class="word">{{ prompts[step]?.label }}</p>
      <p class="state">{{ recorded ? 'Enregistré ✓' : 'Dis le mot…' }}</p>
      <div class="level" aria-hidden="true"><span :style="{ width: `${level * 100}%` }" /></div>
      <div class="buttons"><ion-button fill="outline" @click="stop">Annuler</ion-button></div>
    </template>

    <template v-else>
      <p class="state">{{ ready ? `Enregistrements : ${count} syllabes.` : 'Pas encore d’enregistrement.' }}</p>
      <div class="buttons">
        <ion-button v-if="mode === 'idle'" fill="outline" @click="record">{{ ready ? 'Réenregistrer' : 'Enregistrer mes mots' }}</ion-button>
        <ion-button v-if="ready" :color="mode === 'test' ? 'medium' : 'primary'" @click="mode === 'test' ? stop() : test()">
          {{ mode === 'test' ? 'Arrêter' : 'Tester' }}
        </ion-button>
      </div>
      <template v-if="mode === 'test'">
        <div class="level" aria-hidden="true"><span :style="{ width: `${level * 100}%` }" /></div>
        <p v-if="result" class="verdict" :class="result.ok ? 'ok' : 'ko'">{{ result.text }}</p>
        <ol class="log">
          <li v-for="(line, i) in log" :key="i">{{ line }}</li>
        </ol>
      </template>
    </template>
    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { IonButton, onIonViewWillLeave } from '@ionic/vue'
import { closest, listenToSyllables, loadTemplates, MIN_MARGIN, MIN_VOICED_MS, saveTemplates, type Syllable, type SyllableListening, type Templates } from '@/audio/wordMatch'
import { pitchClassName } from '@/music/notes'

const props = defineProps<{
  /** Classe de la note affichée (0 = Do), pour le verdict. */
  expected: number
}>()

const NOTES = [
  { key: 'do', label: 'do', pc: 0 },
  { key: 're', label: 'ré', pc: 2 },
  { key: 'mi', label: 'mi', pc: 4 },
  { key: 'fa', label: 'fa', pc: 5 },
  { key: 'sol', label: 'sol', pc: 7 },
  { key: 'la', label: 'la', pc: 9 },
  { key: 'si', label: 'si', pc: 11 },
]
const TAKES = 3
const prompts = NOTES.flatMap((n) => Array.from({ length: TAKES }, () => n))

const templates = shallowRef<Templates>(loadTemplates())
/** Seulement les noms de notes (ce test ne demande pas d'altérations). */
const noteTemplates = computed(() => Object.fromEntries(NOTES.filter((n) => templates.value[n.key]).map((n) => [n.key, templates.value[n.key]])))
const count = computed(() => Object.values(templates.value).reduce((n, l) => n + l.length, 0))
const ready = computed(() => NOTES.every((n) => templates.value[n.key]?.length))
const mode = ref<'idle' | 'record' | 'test'>('idle')
const step = ref(0)
const recorded = ref(false)
const level = ref(0)
const error = ref('')
const result = ref<{ ok: boolean; text: string } | null>(null)
const log = ref<string[]>([])
let listening: SyllableListening | null = null
let fresh: Templates = {}

function stop() {
  listening?.stop()
  listening = null
  mode.value = 'idle'
  level.value = 0
}

async function listen(onSyllable: (s: Syllable) => void) {
  error.value = ''
  try {
    listening = await listenToSyllables(onSyllable, (l) => (level.value = l))
  } catch {
    error.value = 'Micro inaccessible : autorise le micro pour cette appli.'
    mode.value = 'idle'
  }
}

function record() {
  fresh = {}
  step.value = 0
  recorded.value = false
  mode.value = 'record'
  void listen((s) => {
    // Souffle, toux : pas un mot, on ne l'enregistre pas.
    if (recorded.value || mode.value !== 'record' || s.voiced < MIN_VOICED_MS) return
    const note = prompts[step.value]
    ;(fresh[note.key] ??= []).push(s.features)
    recorded.value = true
    setTimeout(() => {
      recorded.value = false
      step.value++
      if (step.value < prompts.length) return
      // « Dièse » et « bémol » (enregistrés dans « Ma voix ») sont gardés.
      templates.value = { ...loadTemplates(), ...fresh }
      saveTemplates(templates.value)
      stop()
    }, 700)
  })
}

function test() {
  mode.value = 'test'
  result.value = null
  log.value = []
  void listen((s) => {
    const length = Math.round(s.end - s.start)
    // Souffle, toux : presque pas de voix avec une hauteur ; ignoré sans réponse.
    if (s.voiced < MIN_VOICED_MS) {
      log.value = [`· bruit ignoré (voix ${s.voiced} ms) · syllabe ${length} ms`, ...log.value].slice(0, 40)
      return
    }
    const t0 = performance.now()
    const best = closest(s.features, noteTemplates.value)
    const ms = Math.round(performance.now() - t0)
    if (!best) return
    const note = NOTES.find((n) => n.key === best.key)
    if (!note) return
    const expected = pitchClassName(props.expected)
    if (best.noise) {
      log.value = [`· bruit ignoré (le plus proche : ${note.label}, distance ${best.distance.toFixed(1)}) · syllabe ${length} ms`, ...log.value].slice(0, 40)
      return
    }
    // Deux notes presque à égalité : mieux vaut ne pas répondre que deviner.
    const sure = best.margin >= MIN_MARGIN
    const ok = sure && note.pc === props.expected
    result.value = sure
      ? { ok, text: ok ? `Entendu : ${note.label} ✓` : `Entendu : ${note.label}, au lieu de ${expected}` }
      : { ok: false, text: `Pas sûr (peut-être ${note.label}) : redis ${expected}.` }
    const verdict = !sure ? '?' : ok ? '✓' : '✗'
    log.value = [
      `${verdict} attendu ${expected} · entendu ${note.label} · distance ${best.distance.toFixed(1)} · écart ${best.margin.toFixed(1)} · syllabe ${length} ms · calcul ${ms} ms`,
      ...log.value,
    ].slice(0, 40)
  })
}

/** Le journal, du plus ancien au plus récent (bouton « Copier » du Test du micro). */
const report = () => [...log.value].reverse()

defineExpose({ stop, report })
onIonViewWillLeave(stop)
onBeforeUnmount(stop)
</script>

<style scoped>
.sound {
  margin-top: 18px;
}
h2 {
  margin: 18px 0 6px;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
.how {
  color: var(--ion-color-medium);
  font-size: 14px;
}
.progress,
.state {
  text-align: center;
  font-weight: 600;
  color: var(--ion-color-medium);
}
.word {
  margin: 4px 0;
  text-align: center;
  font-size: 48px;
  font-weight: 800;
  color: var(--ion-color-primary);
}
.buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}
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
.verdict {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
}
.verdict.ok {
  color: var(--ion-color-success);
}
.verdict.ko,
.error {
  color: var(--ion-color-danger);
}
.log {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: monospace;
  font-size: 12px;
}
</style>
