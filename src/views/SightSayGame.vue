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
    :note-marks="noteMarks"
    :music-label="musicLabel"
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
        <!-- Partie finie (essai compris) : le compte rendu de tout ce qui a été entendu et jugé. -->
        <button v-if="sight.phase.value === 'over'" class="report" @click="copyReport">{{ copied ? 'Compte rendu copié ✓' : 'Copier le compte rendu' }}</button>
      </div>
    </template>
    <template #result>
      <div class="report-box">
        <button class="report" @click="copyReport">{{ copied ? 'Compte rendu copié ✓' : 'Copier le compte rendu' }}</button>
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
import { clefLabel, noteName, parseSightSettings, notesForMedal, parseSpokenNotes, SAY_LEVELS, SIGHT_MEDAL_POINTS, tempoAfter, trialTempo } from '@/games/sightReading'
import { tempoName } from '@/games/tempo'
import { trophyEvent } from '@/games/trophies'
import { online } from '@/player/online'
// Mots appris de la voix du joueur (« Ma voix ») : chargés pour la lecture de ce qu'il dit.
import { recognition, soundReady } from '@/games/voiceWords'
import { listenToSyllables, loadTemplates, saveTemplates, type Syllable, type SyllableListening } from '@/audio/wordMatch'
import { SoundJudge, type Learned } from '@/games/soundJudge'

const route = useRoute()
const settings = parseSightSettings(route.query)

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
const sight = useSightReading(quiz, settings.level, 1.1, fastStart, SAY_LEVELS)

const heard = ref('')
/** La voix du joueur vient d'être entendue : le mot est en cours de reconnaissance. */
const recognizing = ref(false)
const micError = ref('')
let speech: SpeechListening | null = null
/** Séance de reconnaissance en cours, et nombre de notes déjà jugées dans son texte. */
let session = -1
let consumed = 0

function stopSpeech() {
  speech?.stop()
  speech = null
  syllables?.stop()
  syllables = null
}
onBeforeUnmount(stopSpeech)

// ——— Compte rendu : tout ce qui est entendu et jugé, à copier en fin de partie pour comprendre une erreur ———

const report: string[] = []
let t0 = 0
const copied = ref(false)

/** Où est la note à lire par rapport à la barre à l'instant `at` (en temps : -1,5 = à un temps et demi de la barre). */
function lateness(at = performance.now()): number | undefined {
  const n = sight.current.value
  const staff = sight.notes.value.find((s) => s.note === n)
  if (!n || !staff) return undefined
  return sight.position.value - (performance.now() - at) * (sight.tempo.value / 60000) - staff.index
}

/** La note à lire en ce moment, et où elle est par rapport à la barre. */
function where(at = performance.now()): string {
  const n = sight.current.value
  const late = lateness(at)
  if (!n || late === undefined) return 'aucune note à lire'
  return `à lire : ${noteName(n)} (${late >= 0 ? '+' : ''}${late.toFixed(2)} temps)`
}

/**
 * Réponse fausse dite tôt (la note à plus d'un temps et demi de la barre) : sans doute une exclamation (« oula ! »)
 * plutôt qu'une réponse ; ignorée. Le joueur a encore le temps de dire la bonne note.
 */
const EARLY_BEATS = 1.5
function earlyWrong(pc: number, at: number): boolean {
  const late = lateness(at)
  return pc !== sight.current.value?.pc && late !== undefined && late < -EARLY_BEATS
}

function log(line: string, at = performance.now()) {
  report.push(`${((at - t0) / 1000).toFixed(2).padStart(6)} s  ${line}`)
}

async function copyReport() {
  const t = loadTemplates()
  const lines = [
    `Lecture continue · ${new Date().toLocaleString('fr-FR')} · version du ${new Date(__BUILD_TIME__).toLocaleString('fr-FR')}`,
    `Niveau ${SAY_LEVELS[settings.level].label} · tempo de départ ${tempoAfter(settings.level, 0, fastStart)} · reconnaissance ${bySound ? 'par le son' : 'Google'}`,
    bySound ? `Enregistrements : ${Object.entries(t).map(([k, l]) => `${k} ${l.length}`).join(', ')}` : '',
    `Résultat : ${readLabel.value}, jusqu'à ♩ = ${sight.topTempo.value} · ${sight.reason.value}`,
    '',
    ...report,
  ]
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    micError.value = 'Copie impossible.'
  }
}

/** Dernière note jugée. */
let lastPc = -1

function judge(pc: number, heardSyllables: Learned[] = []) {
  consumed++
  recognizing.value = false
  // Deux notes de suite n'ont jamais le même nom : la note qu'on vient de valider, redite (le joueur la répète parce
  // que le mot tarde à être reconnu, ou la phrase précédente revient en retard), n'est pas une réponse pour la suivante.
  if (pc === lastPc) return log(`  ${pitchClassName(pc)} redit : ignoré`)
  lastPc = pc
  const before = sight.read.value
  const context = where()
  const taken = sight.submit(pc, `Tu as dit ${pitchClassName(pc)}`)
  const right = taken && sight.read.value > before
  const verdict = !taken ? 'pas pris en compte' : right ? 'JUSTE ✓' : 'FAUX ✗'
  // Nom de la réponse : celui de la note à lire quand c'est la même (« Mi♭ » plutôt que « Ré♯ »).
  const target = [...sight.notes.value].reverse().find((n) => n.state === 'ok' && n.note.pc === pc)?.note
  log(`→ réponse ${right && target ? noteName(target) : pitchClassName(pc)} · ${context} · ${verdict}`)
  // Réponse juste : ses syllabes, dites en jeu, rejoignent les enregistrements (la reconnaissance s'habitue à ta voix en jeu).
  if (right) soundJudge.learn(heardSyllables)
}

function onSpeech(text: string, s: number, final: boolean, alternatives: string[] = [text]) {
  if (sight.phase.value !== 'running') return
  if (s !== session) {
    session = s
    consumed = 0
  }
  heard.value = text
  log(`Google ${final ? 'final' : 'partiel'} : ${alternatives.map((a) => `« ${a} »`).join(', ')}`)
  // Parmi les transcriptions possibles, celle où l'on trouve le plus de noms de notes (la plus probable à égalité).
  const said = alternatives.map(parseSpokenNotes).reduce((best, notes) => (notes.length > best.length ? notes : best), parseSpokenNotes(text))
  for (let i = consumed; i < said.length && sight.phase.value === 'running'; i++) judge(said[i].pc)
}

/** Instant d'un événement du module vocal (horloge Date.now()) sur l'horloge du jeu (performance.now()). */
const perfTime = (at: number) => performance.now() - (Date.now() - at)
/** Fin de la dernière parole entendue par la reconnaissance. */
let speechEnd = 0

function onEvent(e: SpeechEvent) {
  if (e.type === 'onset') {
    if (sight.phase.value === 'running') log(`attaque de la voix · ${where(perfTime(e.at))}`, perfTime(e.at))
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
let syllables: SyllableListening | null = null
const soundJudge = new SoundJudge(
  loadTemplates(),
  {
    target() {
      const n = sight.current.value
      return n && { pc: n.pc, letter: n.note.letter }
    },
    early: earlyWrong,
    lastPc: () => lastPc,
    onset: (at) => sight.onset(at),
    answer: (pc, list) => judge(pc, list),
    heard: (text) => (heard.value = text),
    log,
    label: pitchClassName,
    where,
  },
  saveTemplates,
)

/** Le temps d'une syllabe entière (700 ms au plus) : au-delà, la voix entendue n'a rien donné. */
const VOICE_WAIT_MS = 900

/**
 * La voix démarre : le mot ne sera connu qu'à la fin de la syllabe, mais la note a été commencée à temps. Sans cela, une
 * note dite juste avant la barre compterait pour oubliée avant même d'avoir été jugée.
 */
function onVoiceStart(at: number) {
  if (sight.phase.value !== 'running') return
  sight.onset(at)
  setTimeout(() => sight.forgetOnsets(at + 1), VOICE_WAIT_MS)
}

function onSyllable(s: Syllable) {
  if (sight.phase.value !== 'running') return
  soundJudge.syllable(s)
  // La syllabe est jugée : ce qui attendait son résultat n'a plus lieu d'être.
  sight.forgetOnsets(s.end)
}

async function begin(): Promise<number> {
  const started = sight.start()
  micError.value = ''
  heard.value = ''
  lastPc = -1
  recognizing.value = false
  soundJudge.reset()
  report.length = 0
  t0 = performance.now()
  log('départ (la première note arrive à la barre dans 3 temps)')
  if (bySound) {
    if (!syllables) {
      try {
        syllables = await listenToSyllables(onSyllable, undefined, onVoiceStart)
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
  log(`FIN : ${sight.reason.value}`)
  stopSpeech()
  if (!fastStart) trophyEvent({ type: 'sight-run', game: 'lis-dis', notes: sight.read.value, tempo: tempoAfter(settings.level, Math.max(0, sight.read.value - 1), undefined, SAY_LEVELS[settings.level].step) })
})

const readLabel = computed(() => `${sight.read.value} note${sight.read.value > 1 ? 's' : ''} lue${sight.read.value > 1 ? 's' : ''}`)
/** Écran de fin : une note verte par note lue, puis une rouge pour celle qui a arrêté la partie. */
const noteMarks = computed(() => [...Array.from({ length: sight.read.value }, () => true), false])
const medalNotes = notesForMedal(settings.level, SAY_LEVELS)
const musicLabel = computed(() =>
  sight.read.value >= medalNotes ? 'médaille atteinte : joué sans une fausse note' : `${sight.read.value} note${sight.read.value > 1 ? 's' : ''} sur ${medalNotes} pour la médaille`,
)
const summary = computed(() => `${readLabel.value}, jusqu'à ♩ = ${sight.topTempo.value}`)
const status = computed(() => {
  if (sight.phase.value === 'over') return sight.reason.value
  if (sight.position.value < 0) return 'Les notes arrivent… prépare-toi à les nommer.'
  return 'Dis les notes avant la barre, aussi vite que tu peux : « do », « sol », « si »…'
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
.report-box {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.report {
  margin-top: 10px;
  padding: 8px 14px;
  border: none;
  border-radius: 12px;
  background: var(--hw-surface, #fff);
  color: var(--ion-color-primary);
  font-family: inherit;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(45, 48, 71, 0.08);
}
</style>
