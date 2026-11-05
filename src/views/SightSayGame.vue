<template>
  <game-shell
    title="Lecture continue"
    prompt="Dis chaque note avant qu’elle n’atteigne la barre violette."
    :quiz="quiz"
    :board="{ game: 'lis-dis', level: settings.level, questions: 1 }"
    settings-href="/games/lis-dis"
    no-tuning-fork
    endless
    :answers-label="summary"
    :score-ratio="sight.points.value / SIGHT_MEDAL_POINTS"
    :live-points="sight.points.value"
    :progress-label="readLabel"
  >
    <template #player>
      <div class="player">
        <p class="tempo">
          ♩ = <strong>{{ sight.tempo.value }}</strong> <small>{{ tempoName(sight.tempo.value) }}</small>
        </p>
        <scrolling-staff
          :notes="sight.notes.value"
          :position="sight.position.value"
          :clef="sight.current.value?.clef ?? 'sol'"
          :label="sight.current.value ? `${clefLabel(sight.current.value.clef)}, note à lire` : 'Portée'"
        />
        <p class="status" :class="{ ko: sight.phase.value === 'over' }" aria-live="polite">{{ status }}</p>
        <p v-if="micError" class="error">{{ micError }}</p>
        <!-- Ce que la reconnaissance vocale a entendu, pour comprendre une réponse refusée. -->
        <p class="heard">{{ recognizing ? 'Je t’ai entendu, je reconnais le mot…' : heard ? `« ${heard} »` : ' ' }}</p>
      </div>
    </template>
  </game-shell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GameShell from '@/components/GameShell.vue'
import ScrollingStaff from '@/components/ScrollingStaff.vue'
import { useQuiz } from '@/composables/useQuiz'
import { useSightReading } from '@/composables/useSightReading'
import { listenToSpeech, type SpeechEvent, type SpeechListening } from '@/audio/speech'
import { pitchClassName } from '@/music/notes'
import { clefLabel, parseSightSettings, parseSpokenNotes, SIGHT_LEVELS, SIGHT_MEDAL_POINTS, tempoAfter, trialTempo } from '@/games/sightReading'
import { tempoName } from '@/games/tempo'
import { trophyEvent } from '@/games/trophies'
import { online } from '@/player/online'
// Mots appris de la voix du joueur (« Ma voix ») : chargés pour la lecture de ce qu'il dit.
import { recognition, soundReady } from '@/games/voiceWords'
import { closest, listenToSyllables, loadTemplates, MIN_MARGIN, MIN_VOICED_MS, type Syllable, type SyllableListening } from '@/audio/wordMatch'

const route = useRoute()
const settings = parseSightSettings(route.query)
const { accidentals } = SIGHT_LEVELS[settings.level]

const quiz = useQuiz({
  total: 1,
  createQuestion: () => ({}),
  play: () => begin(),
  untimed: true,
  advanceDelay: null,
})
// La reconnaissance vocale rend le mot avec un peu de retard. Sur Android, chaque note est jugée au moment où le joueur a commencé
// à la dire (attaque de la voix) ; ailleurs, ou sans attaque repérée, on compte 1,1 s de reconnaissance.
// Essai rapide : on part de ♩ = 120, pour s'entraîner à enchaîner les notes.
const fastStart = trialTempo(quiz.trial, route.query.tempo)
const sight = useSightReading(quiz, settings.level, 1.1, fastStart)

const heard = ref('')
/** La voix du joueur vient d'être entendue : le mot est en cours de reconnaissance. */
const recognizing = ref(false)
const micError = ref('')
let speech: SpeechListening | null = null
/** Séance de reconnaissance en cours, et nombre de notes déjà jugées dans son texte. */
let session = -1
let consumed = 0
/** Une lettre seule en fin de phrase (« fa… ») : on attend un instant un éventuel « dièse » ou « bémol ». */
let pending: ReturnType<typeof setTimeout> | undefined
const ACCIDENTAL_WAIT_MS = 350

function stopSpeech() {
  clearTimeout(pending)
  speech?.stop()
  speech = null
  syllables?.stop()
  syllables = null
  if (held) clearTimeout(held.timer)
  held = null
}
onBeforeUnmount(stopSpeech)

/** Dernière note jugée. */
let lastPc = -1

function judge(pc: number) {
  consumed++
  recognizing.value = false
  // Deux notes de suite n'ont jamais le même nom : la note qu'on vient de valider, redite (le joueur la répète parce
  // que le mot tarde à être reconnu, ou la phrase précédente revient en retard), n'est pas une réponse pour la suivante.
  if (pc === lastPc) return
  lastPc = pc
  sight.submit(pc, `Tu as dit ${pitchClassName(pc)}`)
}

function onSpeech(text: string, s: number, final: boolean, alternatives: string[] = [text]) {
  if (sight.phase.value !== 'running') return
  if (s !== session) {
    session = s
    consumed = 0
  }
  heard.value = text
  clearTimeout(pending)
  // Parmi les transcriptions possibles, celle où l'on trouve le plus de noms de notes (la plus probable à égalité).
  const said = alternatives.map(parseSpokenNotes).reduce((best, notes) => (notes.length > best.length ? notes : best), parseSpokenNotes(text))
  for (let i = consumed; i < said.length && sight.phase.value === 'running'; i++) {
    const n = said[i]
    if (accidentals && !n.altered && !final && i === said.length - 1) {
      pending = setTimeout(() => {
        if (session === s && consumed === i && sight.phase.value === 'running') judge(n.pc)
      }, ACCIDENTAL_WAIT_MS)
      return
    }
    judge(n.pc)
  }
}

/** Instant d'un événement du module vocal (horloge Date.now()) sur l'horloge du jeu (performance.now()). */
const perfTime = (at: number) => performance.now() - (Date.now() - at)
/** Fin de la dernière parole entendue par la reconnaissance. */
let speechEnd = 0

function onEvent(e: SpeechEvent) {
  if (e.type === 'onset') {
    sight.onset(perfTime(e.at))
    if (sight.phase.value === 'running') recognizing.value = true
  }
  if (e.type === 'end') speechEnd = perfTime(e.at)
  // Phrase terminée : ses attaques restées sans nom de note (bruit, « euh ») sont oubliées, après le jugement de ses mots.
  if (e.type === 'final' || e.type === 'error') {
    const end = speechEnd
    setTimeout(() => (recognizing.value = false))
    setTimeout(() => sight.forgetOnsets(end))
  }
}

// ——— Reconnaissance par le son (par défaut) : chaque syllabe comparée aux enregistrements du joueur, sans Internet ———

/** Par le son, si le joueur a enregistré ses mots (sinon, Google). */
const bySound = recognition.value === 'son' && soundReady()
const templates = loadTemplates()
const SOUND_PCS: Record<string, number> = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 }
const SOUND_LABELS: Record<string, string> = { do: 'do', re: 'ré', mi: 'mi', fa: 'fa', sol: 'sol', la: 'la', si: 'si', diese: 'dièse', bemol: 'bémol' }
let syllables: SyllableListening | null = null
/** Note dite, en attente d'un éventuel « dièse » ou « bémol » (niveaux avec altérations). */
let held: { pc: number; timer: ReturnType<typeof setTimeout> } | null = null
const HOLD_MS = 900
/** Après « dièse » ou « bémol », ce qui suit de près (le reste du mot) n'est pas une note. */
let skipUntil = 0
/** Altération de chaque enregistrement : « dièse » et sa seconde syllabe (diese2) ont le même sens. */
const ACCIDENTAL: Record<string, 1 | 11> = { diese: 1, diese2: 1, bemol: 11, bemol2: 11 }
/** Sens d'un enregistrement, pour juger si deux mots sont presque à égalité (deux moitiés de « dièse » ne le sont pas). */
const meaning = (key: string) => key.replace(/2$/, '')

function release() {
  if (!held) return
  clearTimeout(held.timer)
  const { pc } = held
  held = null
  judge(pc)
}

function onSyllable(s: Syllable) {
  if (sight.phase.value !== 'running') return
  // Souffle, toux, seconde moitié de « dièse » : ignorés.
  if (s.voiced < MIN_VOICED_MS || s.start < skipUntil) return
  const best = closest(s.features, templates, meaning)
  // Bruit, ou deux mots presque à égalité : pas de réponse (le joueur peut redire la note).
  if (!best || best.noise || best.margin < MIN_MARGIN) {
    if (best && !best.noise) heard.value = `${SOUND_LABELS[meaning(best.key)] ?? '?'} ?`
    return
  }
  const shift = ACCIDENTAL[best.key]
  if (shift) {
    // Dièse ou bémol (ou seulement sa seconde syllabe, quand la première s'est fondue dans la note) : il altère la note dite juste avant.
    skipUntil = s.end + 300
    if (!held) return
    clearTimeout(held.timer)
    const pc = (held.pc + shift) % 12
    held = null
    heard.value = pitchClassName(pc)
    return judge(pc)
  }
  heard.value = SOUND_LABELS[best.key] ?? ''
  const pc = SOUND_PCS[best.key]
  if (pc === undefined) return
  release()
  // La note redite (déjà validée) n'est pas une réponse pour la suivante : pas d'attaque à dater.
  if (pc === lastPc) return
  // La réponse est datée du début de la syllabe.
  sight.onset(s.start)
  if (!accidentals) return judge(pc)
  held = { pc, timer: setTimeout(release, HOLD_MS) }
}

async function begin(): Promise<number> {
  const started = sight.start()
  micError.value = ''
  heard.value = ''
  lastPc = -1
  recognizing.value = false
  skipUntil = 0
  if (bySound) {
    if (!syllables) {
      try {
        syllables = await listenToSyllables(onSyllable)
      } catch {
        micError.value = 'Le micro n’est pas accessible : autorise-le pour cette appli, puis réessaie.'
      }
    }
    return started
  }
  // Arrivé ici sans connexion (bouton « Jouer » des classements, par exemple) : la reconnaissance vocale ne marchera pas.
  if (!online.value) micError.value = 'Pas de connexion à Internet : la reconnaissance vocale ne peut pas comprendre les notes.'
  if (!speech) {
    try {
      speech = await listenToSpeech(onSpeech, onEvent)
    } catch {
      micError.value = 'La reconnaissance vocale n’est pas accessible : autorise le micro pour cette appli, puis réessaie.'
    }
  }
  return started
}

watch(sight.phase, (phase) => {
  if (phase !== 'over') return
  stopSpeech()
  if (!fastStart) trophyEvent({ type: 'sight-run', game: 'lis-dis', notes: sight.read.value, tempo: tempoAfter(settings.level, Math.max(0, sight.read.value - 1)) })
})

const readLabel = computed(() => `${sight.read.value} note${sight.read.value > 1 ? 's' : ''} lue${sight.read.value > 1 ? 's' : ''}`)
const summary = computed(() => `${readLabel.value}, jusqu'à ♩ = ${sight.topTempo.value}`)
const status = computed(() => {
  if (sight.phase.value === 'over') return sight.reason.value
  if (sight.position.value < 0) return 'Les notes arrivent… prépare-toi à les nommer.'
  return 'Dis les notes avant la barre, aussi vite que tu peux : « do », « fa dièse », « si bémol »…'
})
</script>

<style scoped>
.player {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tempo {
  margin: 0 0 10px;
  font-size: 20px;
}
.tempo strong {
  font-size: 34px;
  color: var(--ion-color-primary);
}
.tempo small {
  color: var(--ion-color-medium);
  font-style: italic;
}
.status {
  min-height: 44px;
  margin: 14px 0 4px;
  text-align: center;
  font-weight: 600;
  color: var(--ion-color-medium);
}
.status.ko {
  color: var(--ion-color-danger);
}
.error {
  text-align: center;
  color: var(--ion-color-danger);
}
.heard {
  min-height: 24px;
  margin: 0;
  color: var(--ion-color-medium);
  font-style: italic;
  text-align: center;
}
</style>
