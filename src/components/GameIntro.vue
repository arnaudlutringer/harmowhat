<template>
  <!-- Présentation du jeu, repliable : ouverte tant qu'aucun score n'a été enregistré pour ce jeu, repliée ensuite. -->
  <section class="intro">
    <button class="hw-section-title toggle" :aria-expanded="open" @click="open = !open">
      Présentation
      <ion-icon :icon="open ? chevronUp : chevronDown" aria-hidden="true" />
    </button>
    <div v-if="open" class="text">
      <p v-for="line in INTROS[game]" :key="line">{{ line }}</p>
      <p>
        Chaque question démarre à 10&nbsp;000 points, qui baissent jusqu'à 100 : plus tu réponds vite, plus tu en gagnes.
        Réécouter ou utiliser le diapason coûte 200 points, et une mauvaise réponse n'en rapporte aucun.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronDown, chevronUp } from 'ionicons/icons'
import { hasLocalScores, type GameId } from '@/games/highScores'
import { INTROS } from '@/games/intros'

const props = defineProps<{ game: GameId }>()
const open = ref(!hasLocalScores(props.game))
</script>

<style scoped>
.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}
.toggle ion-icon {
  font-size: 22px;
}
.text p {
  margin: 0 0 10px;
  line-height: 1.45;
  font-size: 15px;
}
</style>
