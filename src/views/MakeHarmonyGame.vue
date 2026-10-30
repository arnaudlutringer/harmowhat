<template>
  <game-shell
    title="Fais l'harmonie"
    :prompt="q.prompt"
    :quiz="quiz"
    :board="{ game: 'fais-harmonie', level: settings.level, questions: settings.questions }"
    settings-href="/games/fais-harmonie"
    swipe-to-next
    no-tuning-fork
  >
    <!-- La note de départ et sa clé ; à la réponse, la note cherchée s'y ajoute, en vert, et toucher la portée
         rejoue les deux notes. Pas de son à deviner pendant la question. -->
    <template #player>
      <button
        class="sheet"
        :class="{ sounding: quiz.playing.value, revealed, vanished: flash.hidden.value }"
        :disabled="!revealed"
        :aria-label="revealed ? `Réécouter ${pitchLabel(q.base)} puis ${pitchLabel(q.target)}` : undefined"
        @click="quiz.listen()"
      >
        <chord-staff
          :notes="revealed ? [q.base, q.target] : [q.base]"
          :clef="CLEFS[q.clef].vex"
          :correct="revealed ? [1] : []"
          melodic
          :label="revealed ? `${CLEFS[q.clef].label} : ${pitchLabel(q.base)}, puis ${pitchLabel(q.target)}` : `${CLEFS[q.clef].label}, note de départ : ${pitchLabel(q.base)}`"
        />
      </button>
    </template>

    <div class="choices">
      <ion-button
        v-for="choice in CHOICES"
        :key="choice.pc"
        :color="colorFor(choice.pc)"
        :disabled="!quiz.canAnswer.value && !revealed"
        @click="choose(choice.pc)"
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
import ChordStaff from '@/components/ChordStaff.vue'
import { useFlash } from '@/composables/useFlash'
import { useQuiz } from '@/composables/useQuiz'
import { playSequence } from '@/audio/engine'
import { CHOICES, CLEFS, createQuestion, LEVELS, parseSettings, pitchLabel, type Question } from '@/games/makeHarmony'

const settings = parseSettings(useRoute().query)

// Rien n'est joué pendant la question (le décompte des points démarre aussitôt) ; à la réponse, on entend
// la note de départ puis la note cherchée. Pas de passage automatique : le joueur glisse vers la gauche quand
// il a fini de regarder (et de réécouter) la portée.
const quiz = useQuiz({
  total: settings.questions,
  advanceDelay: null,
  createQuestion: () => createQuestion(settings.level),
  play: (question: Question): Promise<number> =>
    quiz.feedback.value
      ? playSequence([{ midi: question.base.midi, at: 0, len: 1 }, { midi: question.target.midi, at: 1, len: 1.5 }], 0.5).then((p) => p.duration)
      : Promise.resolve(0),
})
// Impossible : la portée s'efface au bout de quelques secondes.
const flash = useFlash(quiz, LEVELS[settings.level].flashMs)
const q = computed(() => quiz.question.value)
const revealed = computed(() => quiz.feedback.value !== null)

function choose(pc: number) {
  if (!quiz.canAnswer.value) return
  q.value.picked = pc
  // Une note écrite autrement que sur sa touche (Do double dièse, Mi♯…) est rappelée avec le nom du bouton.
  const name = pitchLabel(q.value.target)
  const key = CHOICES[q.value.answer].label
  const message = key.split(' / ').includes(name) ? `C'était ${name}.` : `C'était ${name} (${key}).`
  quiz.answer(pc === q.value.answer, message)
  void quiz.listen()
}

// Après la réponse : la bonne note en vert (comme sur la portée), le mauvais choix en rouge.
function colorFor(pc: number) {
  if (!revealed.value) return undefined
  if (pc === q.value.answer) return 'success'
  if (pc === q.value.picked) return 'danger'
  return 'medium'
}
</script>

<style scoped>
/* Portée en grand : la note de départ, puis la réponse. */
/* Impossible : la portée effacée laisse son cadre vide. */
.sheet.vanished > * {
  visibility: hidden;
}
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
  height: 52px;
  --padding-start: 4px;
  --padding-end: 4px;
  font-size: 15px;
  white-space: nowrap;
  text-transform: none;
}
</style>
