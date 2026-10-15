<template>
  <game-shell
    title="Lecture de note"
    :prompt="`Quelle est cette note ? (niveau ${LEVELS[settings.level].label.toLowerCase()})`"
    :quiz="quiz"
    :board="{ game: 'lecture-note', level: settings.level, questions: settings.questions }"
    settings-href="/games/lecture-note"
    swipe-to-next
    no-tuning-fork
  >
    <!-- Jeu visuel : pas de son à deviner. Après la réponse, toucher la portée fait entendre la note. -->
    <template #player>
      <button
        class="sheet"
        :class="{ sounding: quiz.playing.value, revealed }"
        :disabled="!revealed"
        :aria-label="revealed ? `Écouter le ${q.fullName}` : undefined"
        @click="quiz.listen()"
      >
        <chord-staff :notes="[q.note]" :clef="CLEFS[q.clef].vex" :label="`${CLEFS[q.clef].label}, note à lire`" />
      </button>
      <p class="hint">{{ quiz.playing.value ? 'Écoute…' : revealed ? 'Touche la portée pour écouter la note' : CLEFS[q.clef].label }}</p>
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
import { useQuiz } from '@/composables/useQuiz'
import { playPiano } from '@/audio/engine'
import { CHOICES, CLEFS, createQuestion, LEVELS, parseSettings, type Question } from '@/games/readNote'

const settings = parseSettings(useRoute().query)

// La note n'est pas jouée pendant la question (le décompte des points démarre aussitôt), seulement après la réponse.
// Pas de passage automatique : le joueur glisse vers la gauche quand il a fini de regarder la portée.
const quiz = useQuiz({
  total: settings.questions,
  createQuestion: () => createQuestion(settings.level),
  play: (question: Question): Promise<number> => (quiz.feedback.value ? playPiano(question.note.midi) : Promise.resolve(0)),
  advanceDelay: null,
})
const q = computed(() => quiz.question.value)
const revealed = computed(() => quiz.feedback.value !== null)

function choose(pc: number) {
  if (!quiz.canAnswer.value) return
  q.value.picked = pc
  quiz.answer(pc === q.value.answer, `C'était un ${q.value.fullName}.`)
  void quiz.listen()
}

// Après la réponse : la bonne note en vert, le mauvais choix en rouge.
function colorFor(pc: number) {
  if (!revealed.value) return undefined
  if (pc === q.value.answer) return 'success'
  if (pc === q.value.picked) return 'danger'
  return 'medium'
}
</script>

<style scoped>
/* Portée en grand : c'est elle qu'on lit. */
.sheet {
  width: 100%;
  max-width: 340px;
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
.sheet.sounding {
  box-shadow: 0 0 0 4px var(--ion-color-secondary), 0 8px 24px rgba(0, 0, 0, 0.2);
}
/* La portée reste lisible tant que la question est ouverte (pas de grisé du bouton désactivé). */
.sheet:disabled {
  opacity: 1;
}
.sheet :deep(.staff) {
  color: #222;
}
/* VexFlow fixe la taille du dessin en style ; ici la portée occupe toute la largeur de la feuille. */
.sheet :deep(svg) {
  width: 100% !important;
  height: auto !important;
}
.hint {
  color: var(--ion-color-medium);
  margin: 12px 0 20px;
  text-align: center;
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
