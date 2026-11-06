<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Test du micro" />
      <div class="test">
        <p class="how">Dis le nom de la note écrite, et regarde ce que la reconnaissance par le son en comprend.</p>

        <div class="sheet">
          <chord-staff :notes="[note]" clef="treble" :label="`Note à dire : ${expected}`" />
        </div>
        <p class="expected">Note attendue : <strong>{{ expected }}</strong></p>
        <div class="buttons">
          <ion-button fill="outline" @click="nextNote">Autre note</ion-button>
        </div>

        <sound-match-test ref="soundTest" :expected="pc" />

        <!-- Notes enchaînées : « Lecture continue » en essai, en partant de ♩ = 120 (hors records et trophées). -->
        <h2>Enchaînement rapide</h2>
        <p class="how">Une partie d’essai de « Lecture continue » qui démarre à ♩ = {{ FAST_TRIAL_TEMPO }}, pour tester les notes dites à la suite.</p>
        <div class="buttons">
          <ion-button fill="outline" router-link="/games/lis-dis/jouer?questions=1&level=debutant&tempo=120&essai=1">Lecture à ♩ = {{ FAST_TRIAL_TEMPO }}</ion-button>
        </div>

        <!-- Banc d'essai : une liste à lire, enregistrée pour rejouer la voix du joueur hors du téléphone. -->
        <h2>Banc d'essai</h2>
        <p class="how">Une liste de notes à lire, environ 3 minutes. Le fichier obtenu permet de mesurer et d'améliorer la reconnaissance sur ta voix.</p>
        <div class="buttons">
          <ion-button fill="outline" router-link="/debug/banc">Ouvrir le banc d'essai</ion-button>
        </div>

        <h2>
          Journal
          <button class="copy" @click="copyLog">{{ copied ? 'Copié ✓' : 'Copier' }}</button>
        </h2>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { IonButton, IonContent, IonPage } from '@ionic/vue'
import PageNav from '@/components/PageNav.vue'
import ChordStaff from '@/components/ChordStaff.vue'
import SoundMatchTest from '@/components/SoundMatchTest.vue'
import { randomInt } from '@/music/notes'
import { spelledPitchName } from '@/music/spelling'
import { noteAt } from '@/games/readNote'
import { FAST_TRIAL_TEMPO } from '@/games/sightReading'

/**
 * Écran de test (interrupteur testMicro, voir config/features.ts) : une note à dire, et le détail de la reconnaissance
 * par le son, pour comprendre pourquoi « Lecture continue » n'entend pas une note.
 */

/** Une note naturelle sur la portée en clé de sol (Mi4 à Fa5). */
const randomNote = () => noteAt(randomInt(2 + 7 * 4, 3 + 7 * 5), 0)
const note = shallowRef(randomNote())
const expected = computed(() => spelledPitchName(note.value))
const pc = computed(() => ((note.value.midi % 12) + 12) % 12)

const error = ref('')
const copied = ref(false)
const soundTest = ref<InstanceType<typeof SoundMatchTest> | null>(null)

function nextNote() {
  let n = randomNote()
  while (n.midi % 12 === note.value.midi % 12) n = randomNote()
  note.value = n
}

async function copyLog() {
  try {
    await navigator.clipboard.writeText((soundTest.value?.report() ?? []).join('\n'))
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    error.value = 'Copie impossible : fais une capture d’écran du journal.'
  }
}
</script>

<style scoped>
.test {
  max-width: 480px;
  margin: 0 auto;
}
.how {
  color: var(--ion-color-medium);
  font-size: 14px;
}
.sheet {
  max-width: 260px;
  margin: 8px auto;
  padding: 6px;
  background: #fffdf3;
  color: #222;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.expected {
  text-align: center;
  margin: 8px 0;
}
.expected strong {
  color: var(--ion-color-primary);
  font-size: 22px;
}
.buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.error {
  color: var(--ion-color-danger);
}
h2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 0 6px;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
.copy {
  border: none;
  background: var(--hw-button);
  color: var(--ion-color-primary);
  padding: 4px 10px;
  border-radius: 8px;
  font-family: inherit;
}
</style>
