<template>
  <!-- Médaille gagnée, en grand pour l'annonce de fin de partie : le point de couleur au bout de son ruban, avec un liseré. -->
  <svg class="medal-ribbon" :width="size * 0.75" :height="size" viewBox="0 0 60 80" role="img" :aria-label="NAMES[kind]">
    <path d="M13 0h12l9 40h-12z" fill="#6c5ce7" />
    <path d="M47 0h-12l-9 40h12z" fill="#8f82f2" />
    <circle cx="30" cy="56" r="21" :fill="COLORS[kind].rim" />
    <circle cx="30" cy="56" r="17.5" :fill="COLORS[kind].face" />
    <circle cx="30" cy="56" r="12.5" fill="none" stroke="rgba(255, 255, 255, 0.55)" stroke-width="2" />
    <path d="M18 48a14 14 0 0 1 9-7" fill="none" stroke="rgba(255, 255, 255, 0.7)" stroke-width="3" stroke-linecap="round" />
  </svg>
</template>

<script setup lang="ts">
type LevelKind = 'debutant' | 'normal' | 'expert' | 'impossible'

withDefaults(defineProps<{ kind: LevelKind; size?: number }>(), { size: 80 })

const NAMES: Record<LevelKind, string> = {
  debutant: 'Médaille de bronze',
  normal: 'Médaille d’argent',
  expert: 'Médaille d’or',
  impossible: 'Couronne',
}
/** Les couleurs des points de couleur, avec un liseré plus foncé. */
const COLORS: Record<LevelKind, { face: string; rim: string }> = {
  debutant: { face: '#cd7f32', rim: '#9c5a1e' },
  normal: { face: '#a3adbb', rim: '#7a8597' },
  expert: { face: '#f2c230', rim: '#c4950f' },
  impossible: { face: '#8e5cf0', rim: '#6638cc' },
}
</script>

<style scoped>
.medal-ribbon {
  display: block;
  margin: 0 auto;
  animation: swing 1.2s ease-out;
  transform-origin: 50% 0;
}
/* La médaille se balance un instant au bout de son ruban. */
@keyframes swing {
  0% {
    transform: rotate(-14deg);
  }
  35% {
    transform: rotate(9deg);
  }
  65% {
    transform: rotate(-4deg);
  }
  100% {
    transform: rotate(0);
  }
}
</style>
