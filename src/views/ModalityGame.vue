<template>
  <game-shell
    title="La modalité"
    prompt="Quel est le mode de cette gamme ?"
    :quiz="quiz"
    :board="{ game: 'modalite', level: settings.level, questions: settings.questions }"
    settings-href="/games/modalite"
    swipe-to-next
    no-tuning-fork
  >
    <!-- La gamme écrite tient lieu de bouton de lecture : la toucher (re)joue la gamme. En débutant et normal, elle est
         là dès la question ; en expert (à l'oreille), le bouton de lecture reste jusqu'à la réponse. -->
    <template v-if="cfg.showStaff || revealed" #player>
      <button class="sheet replay" :class="{ sounding: quiz.playing.value }" :aria-label="`Écouter la gamme : ${staffLabel}`" @click="quiz.listen()">
        <scale-staff :notes="q.notes" :steps="cfg.showSteps || revealed" :label="staffLabel" />
      </button>
      <p class="hint">{{ hint }}</p>
    </template>

    <div class="choices">
      <ion-button
        v-for="mode in MODES"
        :key="mode.id"
        :color="colorFor(mode.id)"
        :disabled="!quiz.canAnswer.value && !revealed"
        @click="choose(mode.id)"
      >
        {{ mode.label }} ({{ mode.degree }})
      </ion-button>
    </div>
  </game-shell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton } from '@ionic/vue'
import GameShell from '@/components/GameShell.vue'
import ScaleStaff from '@/components/ScaleStaff.vue'
import { useQuiz } from '@/composables/useQuiz'
import { playSequence } from '@/audio/engine'
import { spelledPitchName } from '@/music/spelling'
import { createQuestion, LEVELS, MODES, parseSettings, type ModeId, type Question } from '@/games/modality'

const settings = parseSettings(useRoute().query)
const cfg = LEVELS[settings.level]

/** Durée d'une note de la gamme (s) ; la dernière, la note de départ à l'octave, est tenue. */
const NOTE_SECONDS = 0.3

// La gamme est jouée en montant ; le décompte des points (et les réponses) démarrent à sa dernière note.
// Pas de passage automatique : le joueur glisse vers la gauche quand il a fini de regarder la portée.
const quiz = useQuiz({
  total: settings.questions,
  advanceDelay: null,
  createQuestion,
  play: (question: Question): Promise<number> =>
    playSequence(question.notes.map((n, i) => ({ midi: n.midi, at: i, len: i === 7 ? 3 : 1 })), NOTE_SECONDS).then((p) => p.duration),
  countdownStart: (question) => (question.notes.length - 1) * NOTE_SECONDS * 1000,
})
const q = computed(() => quiz.question.value)
const revealed = computed(() => quiz.feedback.value !== null)

const staffLabel = computed(() => `Gamme : ${q.value.notes.map(spelledPitchName).join(', ')}`)

/** Sous la portée : comme sous le bouton de lecture des autres jeux (réécoute payante tant que la question est ouverte). */
const hint = computed(() => {
  if (quiz.playing.value) return 'Écoute…'
  if (!quiz.hasListened.value) return 'Lecture…'
  if (revealed.value) return 'Touche la portée pour réécouter la gamme'
  return quiz.replayCosts.value ? `Touche la portée pour réécouter (−${quiz.replayPenalty} pts)` : ' '
})

function choose(id: ModeId) {
  if (!quiz.canAnswer.value) return
  q.value.picked = id
  const { mode, notes } = q.value
  quiz.answer(id === mode.id, `C'était le mode ${mode.label.toLowerCase()} sur ${spelledPitchName(notes[0])} (comme de ${mode.white} à ${mode.white} sur les touches blanches).`)
}

// Après la réponse : le bon mode en vert, le mauvais choix en rouge.
function colorFor(id: ModeId) {
  if (!revealed.value) return undefined
  if (id === q.value.mode.id) return 'success'
  if (id === q.value.picked) return 'danger'
  return 'medium'
}
</script>

<style scoped>
/* La gamme écrite, sur une feuille claire. */
.sheet {
  width: 100%;
  margin: -8px 0 16px;
  padding: 4px;
  background: #fffdf3;
  color: #222;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
/* Expert, après la réponse : la portée à la place du bouton de lecture, cliquable. */
.sheet.replay {
  margin: 0;
  border: none;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.sheet.replay.sounding {
  box-shadow: 0 0 0 4px var(--ion-color-secondary), 0 8px 24px rgba(0, 0, 0, 0.2);
}
.hint {
  color: var(--ion-color-medium);
  margin: 8px 0 14px;
  text-align: center;
}
.sheet :deep(.staff) {
  color: #222;
}
/* VexFlow fixe la taille du dessin en style ; ici la portée est limitée en hauteur (même proportions, centrée),
   pour que la question, la réponse et le message tiennent sans défilement sur un téléphone. */
.sheet :deep(svg) {
  display: block;
  height: 124px !important;
  width: auto !important;
  max-width: 100%;
  margin: 0 auto;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.choices ion-button {
  margin: 0;
  height: 42px;
  font-size: 16px;
  text-transform: none;
}
/* Le septième mode, seul sur sa ligne, prend toute la largeur. */
.choices ion-button:last-child {
  grid-column: span 2;
}
</style>
