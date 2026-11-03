<template>
  <game-shell
    title="Lis et chante"
    prompt="Chante chaque note avant qu'elle ne passe la barre violette."
    :quiz="quiz"
    :board="{ game: 'lis-chante', level: settings.level, questions: 1 }"
    settings-href="/games/lis-chante"
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
        <!-- La note entendue en direct, et la barre qui se remplit pendant qu'elle est tenue. -->
        <p class="heard" aria-hidden="true">{{ heard || ' ' }}</p>
        <div class="hold" aria-hidden="true"><span :style="{ width: `${hold * 100}%` }" /></div>
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
import { listenToMicrophone, type Listening } from '@/audio/microphone'
import { midiOf } from '@/audio/pitch'
import { pitchClassName } from '@/music/notes'
import { clefLabel, parseSightSettings, SIGHT_MEDAL_POINTS, tempoAfter, SungNotes } from '@/games/sightReading'
import { tempoName } from '@/games/tempo'
import { trophyEvent } from '@/games/trophies'

const settings = parseSightSettings(useRoute().query)

// Une seule « question » : toute la partie, de la première note à la première erreur.
const quiz = useQuiz({
  total: 1,
  createQuestion: () => ({}),
  play: () => begin(),
  untimed: true,
  advanceDelay: null,
})
// Une voix met un peu de temps à se poser sur la note : 0,3 s de marge après la barre.
const sight = useSightReading(quiz, settings.level, 0.3)

const sung = new SungNotes()
const hold = ref(0)
const heard = ref('')
const micError = ref('')
let mic: Listening | null = null

function stopMic() {
  mic?.stop()
  mic = null
  hold.value = 0
  heard.value = ''
}
onBeforeUnmount(stopMic)

async function begin(): Promise<number> {
  const started = sight.start()
  micError.value = ''
  sung.reset()
  if (!mic) {
    try {
      mic = await listenToMicrophone((pitch) => {
        if (sight.phase.value !== 'running') return
        const midi = pitch && pitch.clarity >= 0.85 ? midiOf(pitch.frequency) : null
        heard.value = midi === null ? '' : pitchClassName(Math.round(midi))
        const note = sung.push(midi)
        hold.value = sung.progress
        if (note !== null) sight.submit(((note % 12) + 12) % 12, `Tu as chanté ${pitchClassName(note)}`)
      })
    } catch {
      micError.value = 'Le micro n’est pas accessible : autorise-le pour cette appli, puis réessaie.'
    }
  }
  return started
}

// Fin de partie : le micro se coupe.
watch(sight.phase, (phase) => {
  if (phase !== 'over') return
  stopMic()
  trophyEvent({ type: 'sight-run', game: 'lis-chante', notes: sight.read.value, tempo: tempoAfter(settings.level, Math.max(0, sight.read.value - 1)) })
})

const readLabel = computed(() => `${sight.read.value} note${sight.read.value > 1 ? 's' : ''} lue${sight.read.value > 1 ? 's' : ''}`)
const summary = computed(() => `${readLabel.value}, jusqu'à ♩ = ${sight.topTempo.value}`)
const status = computed(() => {
  if (sight.phase.value === 'over') return sight.reason.value
  if (sight.position.value < 0) return 'Les notes arrivent… prépare ta voix.'
  return 'Chante la note qui arrive sur la barre.'
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
/* Hauteur fixe (deux lignes) : le texte change sans faire bouger l'écran. */
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
  min-height: 34px;
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: var(--ion-color-primary);
}
.hold {
  width: 120px;
  height: 4px;
  margin: 4px auto 0;
  border-radius: 2px;
  background: rgba(108, 92, 231, 0.18);
  overflow: hidden;
}
.hold span {
  display: block;
  height: 100%;
  background: var(--ion-color-primary);
  transition: width 0.05s linear;
}
</style>
