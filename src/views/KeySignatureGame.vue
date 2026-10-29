<template>
  <game-shell
    title="La tonalité"
    :prompt="q.prompt"
    :quiz="quiz"
    :board="{ game: 'tonalite', level: settings.level, questions: settings.questions }"
    settings-href="/games/tonalite"
    swipe-to-next
    no-tuning-fork
  >
    <!-- L'armure, avec sa clé. Après la réponse, toucher la portée rejoue la gamme de la bonne tonalité. -->
    <template #player>
      <button
        class="sheet"
        :class="{ sounding: quiz.playing.value, revealed }"
        :disabled="!revealed"
        :aria-label="revealed ? `Réécouter la gamme de ${fullName(q.key)}` : undefined"
        @click="quiz.listen()"
      >
        <key-signature-staff :clef="CLEFS[q.clef].vex" :key-spec="q.key.vex" :label="`${CLEFS[q.clef].label}, ${signatureText(q.key.fifths)}`" />
      </button>
    </template>

    <div class="choices">
      <ion-button
        v-for="choice in q.choices"
        :key="choice.id"
        :color="colorFor(choice.id)"
        :disabled="!quiz.canAnswer.value && !revealed"
        @click="choose(choice.id)"
      >
        {{ choice.label }}
      </ion-button>
    </div>
  </game-shell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton } from '@ionic/vue'
import GameShell from '@/components/GameShell.vue'
import { trophyEvent } from '@/games/trophies'
import KeySignatureStaff from '@/components/KeySignatureStaff.vue'
import { useQuiz } from '@/composables/useQuiz'
import { playSequence } from '@/audio/engine'
import { CLEFS, createQuestion, parseSettings, scaleOf, type Key, type Question } from '@/games/keySignature'

const settings = parseSettings(useRoute().query)

// Rien n'est joué pendant la question (le décompte des points démarre aussitôt) ; à la réponse, on entend la
// gamme de la bonne tonalité, d'un trait (0,18 s par note, la tonique d'arrivée un peu tenue).
// Pas de passage automatique : le joueur glisse vers la gauche quand il a fini.
const SCALE_NOTE_SECONDS = 0.18
const quiz = useQuiz({
  total: settings.questions,
  advanceDelay: null,
  createQuestion: () => createQuestion(settings.level),
  play: (question: Question): Promise<number> =>
    quiz.feedback.value
      ? playSequence(scaleOf(question.key).map((midi, i) => ({ midi, at: i, len: i === 7 ? 3 : 1 })), SCALE_NOTE_SECONDS).then((p) => p.duration)
      : Promise.resolve(0),
})
const q = computed(() => quiz.question.value)
const revealed = computed(() => quiz.feedback.value !== null)

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

/** Armure en toutes lettres : « 3 dièses », « 1 bémol », « sans altération ». */
function signatureText(fifths: number): string {
  if (fifths === 0) return 'sans altération'
  return fifths > 0 ? plural(fifths, 'dièse') : plural(-fifths, 'bémol')
}

/** « Fa♯ majeur », « La mineur ». */
const fullName = (k: Key) => `${k.label.slice(0, -2)} ${k.mode === 'M' ? 'majeur' : 'mineur'}`

function choose(id: string) {
  if (!quiz.canAnswer.value) return
  q.value.picked = id
  if (id === q.value.key.id) trophyEvent({ type: 'key', id, major: q.value.key.mode === 'M' })
  quiz.answer(id === q.value.key.id, `C'était ${fullName(q.value.key)} (${signatureText(q.value.key.fifths)}).`)
  void quiz.listen()
}

// Après la réponse : la bonne tonalité en vert, le mauvais choix en rouge.
function colorFor(id: string) {
  if (!revealed.value) return undefined
  if (id === q.value.key.id) return 'success'
  if (id === q.value.picked) return 'danger'
  return 'medium'
}
</script>

<style scoped>
/* Portée en grand : c'est l'armure qu'on lit. */
.sheet {
  width: 100%;
  max-width: 340px;
  margin-bottom: 24px;
  padding: 4px;
  border: none;
  background: #fffdf3;
  color: #222;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.2s;
}
.sheet.revealed {
  cursor: pointer;
}
/* Pendant la question, la portée n'est pas cliquable mais reste bien lisible (pas de grisé). */
.sheet:disabled {
  opacity: 1;
}
.sheet.sounding {
  box-shadow: 0 0 0 4px var(--ion-color-secondary), 0 8px 24px rgba(0, 0, 0, 0.2);
}
.sheet :deep(.staff) {
  color: #222;
}
/* VexFlow fixe la taille du dessin en style ; ici la portée occupe toute la largeur de la feuille. */
.sheet :deep(svg) {
  width: 100% !important;
  height: auto !important;
}
.choices {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.choices ion-button {
  margin: 0;
  height: 48px;
  --padding-start: 4px;
  --padding-end: 4px;
  font-size: 15px;
  white-space: nowrap;
  text-transform: none;
}
</style>
