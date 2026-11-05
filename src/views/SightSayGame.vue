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
import { clefLabel, noteName, parseSightSettings, parseSpokenNotes, SIGHT_LEVELS, SIGHT_MEDAL_POINTS, tempoAfter, trialTempo } from '@/games/sightReading'
import { tempoName } from '@/games/tempo'
import { trophyEvent } from '@/games/trophies'
import { online } from '@/player/online'
// Mots appris de la voix du joueur (« Ma voix ») : chargés pour la lecture de ce qu'il dit.
import { recognition, soundReady } from '@/games/voiceWords'
import { closest, listenToSyllables, loadTemplates, MIN_MARGIN, MIN_VOICED_MS, noiseLimit, ranked, saveTemplates, type Features, type Syllable, type SyllableListening, type Templates } from '@/audio/wordMatch'

/** Une syllabe entendue et le mot qu'elle était : apprise si la réponse est juste. */
interface Learned {
  key: string
  features: Features
}

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

// ——— Compte rendu : tout ce qui est entendu et jugé, à copier en fin de partie pour comprendre une erreur ———

const report: string[] = []
let t0 = 0
const copied = ref(false)

/** La note à lire en ce moment, et où elle est par rapport à la barre (en temps : -1,5 = à un temps et demi de la barre). */
function where(at = performance.now()): string {
  const n = sight.current.value
  const staff = sight.notes.value.find((s) => s.note === n)
  if (!n || !staff) return 'aucune note à lire'
  const late = sight.position.value - (performance.now() - at) * (sight.tempo.value / 60000) - staff.index
  return `à lire : ${noteName(n)} (${late >= 0 ? '+' : ''}${late.toFixed(2)} temps)`
}

function log(line: string, at = performance.now()) {
  report.push(`${((at - t0) / 1000).toFixed(2).padStart(6)} s  ${line}`)
}

async function copyReport() {
  const t = loadTemplates()
  const lines = [
    `Lecture continue · ${new Date().toLocaleString('fr-FR')}`,
    `Niveau ${SIGHT_LEVELS[settings.level].label} · tempo de départ ${tempoAfter(settings.level, 0, fastStart)} · reconnaissance ${bySound ? 'par le son' : 'Google'}`,
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
  if (right) learn(heardSyllables)
}

function onSpeech(text: string, s: number, final: boolean, alternatives: string[] = [text]) {
  if (sight.phase.value !== 'running') return
  if (s !== session) {
    session = s
    consumed = 0
  }
  heard.value = text
  log(`Google ${final ? 'final' : 'partiel'} : ${alternatives.map((a) => `« ${a} »`).join(', ')}`)
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
const templates = loadTemplates()
const LETTER_KEYS = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si']
const SOUND_PCS: Record<string, number> = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 }
const SOUND_LABELS: Record<string, string> = { do: 'do', re: 'ré', mi: 'mi', fa: 'fa', sol: 'sol', la: 'la', si: 'si', diese: 'dièse', bemol: 'bémol' }
let syllables: SyllableListening | null = null
/** Note dite, en attente d'un éventuel « dièse » ou « bémol » (niveaux avec altérations). */
let held: { pc: number; timer: ReturnType<typeof setTimeout>; learn: Learned[]; features: Features; end: number } | null = null
const HOLD_MS = 900
/** Après « dièse » ou « bémol », ce qui suit de près (le reste du mot) n'est pas une note. */
let skipUntil = 0
/** Altération de chaque enregistrement : « dièse » et sa seconde syllabe (diese2) ont le même sens. */
const ACCIDENTAL: Record<string, 1 | 11> = { diese: 1, diese2: 1, bemol: 11, bemol2: 11 }
/** Sens d'un enregistrement, pour juger si deux mots sont presque à égalité (deux moitiés de « dièse » ne le sont pas). */
const meaning = (key: string) => key.replace(/2$/, '')
/** Syllabe qui suit la note de moins de 250 ms : elle fait partie de la même réponse (« do-dièse » dit d'un trait). */
const GLUED_MS = 250

/**
 * Une note altérée dite en deux syllabes (« do » + « dièse ») : chaque couple note + altération est noté par la somme
 * de ses deux distances, et le meilleur retenu. À égalité (presque) avec la note à lire, c'est elle qui est retenue.
 */
function decodePair(f1: Features, f2: Features) {
  const letters = ranked(f1, noteTemplates)
  const accs = ranked(f2, accidentalTemplates)
  const accDistance = (k: 'diese' | 'bemol') => Math.min(...accs.filter((a) => meaning(a.key) === k).map((a) => a.distance))
  const options = letters
    .flatMap((l) =>
      (['diese', 'bemol'] as const).map((accidental) => ({
        letter: l.key,
        accidental,
        pc: (SOUND_PCS[l.key] + ACCIDENTAL[accidental]) % 12,
        cost: l.distance + accDistance(accidental),
      })),
    )
    .filter((o) => Number.isFinite(o.cost))
    .sort((a, b) => a.cost - b.cost)
  let best = options[0]
  const second = options.find((o) => o.pc !== best?.pc)
  const target = sight.current.value?.pc
  const wanted = options.find((o) => o.pc === target)
  let tie = ''
  if (best && wanted && wanted.pc !== best.pc && wanted.cost - best.cost < MIN_MARGIN) {
    tie = ` · hésitation : ${SOUND_LABELS[wanted.letter]} ${SOUND_LABELS[wanted.accidental]} retenu`
    best = wanted
  }
  const label = (o?: (typeof options)[number]) => (o ? `${SOUND_LABELS[o.letter]} ${SOUND_LABELS[o.accidental]} (${o.cost.toFixed(1)})` : '—')
  return { best, f1, text: `meilleur ${label(options[0])}, puis ${label(second)}${tie}` }
}

function release() {
  if (!held) return
  clearTimeout(held.timer)
  const { pc, learn: syllablesHeard } = held
  held = null
  judge(pc, syllablesHeard)
}

/** Enregistrements des notes seules, et ceux des altérations : on ne compare une syllabe qu'aux mots qui ont du sens à ce moment. */
let noteTemplates: Templates = {}
let accidentalTemplates: Templates = {}
function rebuild() {
  noteTemplates = Object.fromEntries(Object.entries(templates).filter(([k]) => k in SOUND_PCS))
  accidentalTemplates = Object.fromEntries(Object.entries(templates).filter(([k]) => k in ACCIDENTAL))
}
rebuild()

/** Enregistrements gardés par mot : ceux de « Ma voix », plus les derniers appris en jeu. */
const RECORDED = 2
const LEARNED = 4

/** Ajoute aux enregistrements les syllabes d'une réponse juste (en remplaçant les plus anciennes apprises en jeu). */
function learn(list: Learned[]) {
  if (!list.length) return
  for (const { key, features } of list) {
    const kept = [...(templates[key] ?? []), features]
    if (kept.length > RECORDED + LEARNED) kept.splice(RECORDED, 1)
    templates[key] = kept
  }
  saveTemplates(templates)
  rebuild()
}

function onSyllable(s: Syllable) {
  if (sight.phase.value !== 'running') return
  const head = `syllabe ${Math.round(s.end - s.start)} ms, voix ${s.voiced} ms · ${where(s.start)}`
  // Souffle, toux, seconde moitié de « dièse » : ignorés.
  if (s.voiced < MIN_VOICED_MS) return log(`${head} · souffle ou bruit : ignoré`, s.start)
  if (s.start < skipUntil) return log(`${head} · fin de « dièse » / « bémol » : ignoré`, s.start)

  // Une note attend son altération : la syllabe qui suit ne peut être que « dièse » ou « bémol » (sinon, « di » se
  // confond avec « si »). Collée à la note (« do-dièse » d'un trait), ou clairement une altération, on juge les deux
  // syllabes ensemble : la note et l'altération qui, à elles deux, ressemblent le plus à ce qui a été dit.
  if (held) {
    const acc = closest(s.features, accidentalTemplates, meaning)
    const glued = s.start - held.end < GLUED_MS
    if (acc && (glued || !acc.noise)) {
      const pair = decodePair(held.features, s.features)
      log(`${head} · avec la syllabe d'avant : ${pair.text}`, s.start)
      if (pair.best) {
        skipUntil = s.end + 300
        clearTimeout(held.timer)
        const { pc, letter, accidental } = pair.best
        held = null
        heard.value = `${SOUND_LABELS[letter]} ${SOUND_LABELS[accidental]}`
        return judge(pc, [
          { key: letter, features: pair.f1 },
          { key: accidental, features: s.features },
        ])
      }
    } else log(`${head} · pas une altération${acc ? ` (${acc.key}, distance ${acc.distance.toFixed(1)})` : ''}`, s.start)
    // Pas une altération : c'est déjà la note suivante ; celle qui attendait est jugée telle quelle.
    release()
  }

  let best = closest(s.features, noteTemplates)
  const scores = best ? ` · proche : ${best.key} (distance ${best.distance.toFixed(1)}, écart ${best.margin.toFixed(1)})` : ''
  // Hésitation entre la note la plus proche et la note à lire (presque à égalité) : on retient la note à lire.
  const expected = LETTER_KEYS[sight.current.value?.note.letter ?? -1]
  let tieBreak = ''
  if (best && expected && expected !== best.key && (best.noise || best.margin < MIN_MARGIN)) {
    const list = ranked(s.features, noteTemplates)
    const exp = list.find((r) => r.key === expected)
    if (exp && exp.distance - list[0].distance < MIN_MARGIN && exp.distance <= noiseLimit(noteTemplates) * 1.2) {
      tieBreak = ` · hésitation avec ${expected} (distance ${exp.distance.toFixed(1)}) : ${expected} retenu`
      best = { key: expected, distance: exp.distance, margin: MIN_MARGIN, noise: false }
    }
  }
  // Note à lire altérée : une note même incertaine est gardée, pour être jugée avec l'altération qui suit.
  const altered = accidentals && (sight.current.value?.note.alter ?? 0) !== 0
  // Bruit, ou deux notes presque à égalité : pas de réponse (le joueur peut redire la note).
  if (!best || best.noise || (best.margin < MIN_MARGIN && !altered)) {
    if (best && !best.noise) heard.value = `${SOUND_LABELS[best.key] ?? '?'} ?`
    return log(`${head}${scores} · ${best?.noise ? 'trop loin de tes mots' : 'pas sûr'} : ignoré`, s.start)
  }
  log(`${head}${scores}${tieBreak}`, s.start)
  heard.value = SOUND_LABELS[best.key] ?? ''
  const pc = SOUND_PCS[best.key]
  // La note redite (déjà validée) n'est pas une réponse pour la suivante : pas d'attaque à dater.
  if (pc === lastPc) return log(`  ${pitchClassName(pc)} redit : ignoré`)
  // La réponse est datée du début de la syllabe.
  sight.onset(s.start)
  // On n'attend une altération que si elle peut donner la note à lire (« fa » quand c'est fa dièse) ; sinon la note est
  // jugée tout de suite (elle passe au vert sans délai).
  const target = sight.current.value?.pc
  // Note à lire altérée : on attend toujours (« do » peut être le début de « do dièse » même mal reconnu) ;
  // sinon, seulement si une altération peut donner la note à lire.
  const couldAlter = altered || (accidentals && target !== undefined && target !== pc && ((pc + 1) % 12 === target || (pc + 11) % 12 === target))
  const syllable: Learned = { key: best.key, features: s.features }
  if (!couldAlter) return judge(pc, [syllable])
  log(`  ${pitchClassName(pc)} : attente d'un dièse ou d'un bémol (${HOLD_MS} ms)`)
  held = { pc, timer: setTimeout(release, HOLD_MS), learn: [syllable], features: s.features, end: s.end }
}

async function begin(): Promise<number> {
  const started = sight.start()
  micError.value = ''
  heard.value = ''
  lastPc = -1
  recognizing.value = false
  skipUntil = 0
  report.length = 0
  t0 = performance.now()
  log('départ (la première note arrive à la barre dans 3 temps)')
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
  log(`FIN : ${sight.reason.value}`)
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
