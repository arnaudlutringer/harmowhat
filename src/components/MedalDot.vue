<template>
  <!-- Une médaille en point de couleur : bronze, argent, or, la couronne en violet, et le diamant du GOAT en losange bleu. -->
  <span class="medal-dot" :class="[kind, { off: !won }]" :style="{ width: `${size}px`, height: `${size}px` }" role="img" :aria-label="label ?? `${NAMES[kind]} ${won ? 'gagnée' : 'à gagner'}`" />
</template>

<script setup lang="ts">
export type MedalKind = 'debutant' | 'normal' | 'expert' | 'impossible' | 'goat'

withDefaults(defineProps<{ kind: MedalKind; won?: boolean; size?: number; label?: string }>(), { won: true, size: 14, label: undefined })

const NAMES: Record<MedalKind, string> = {
  debutant: 'Médaille de bronze',
  normal: 'Médaille d’argent',
  expert: 'Médaille d’or',
  impossible: 'Couronne',
  goat: 'Diamant',
}
</script>

<style scoped>
.medal-dot {
  display: inline-block;
  flex: none;
  vertical-align: middle;
  border-radius: 50%;
}
.debutant {
  background: #cd7f32;
}
.normal {
  background: #a3adbb;
}
.expert {
  background: #f2c230;
}
.impossible {
  background: #8e5cf0;
}
/* Le diamant : un losange (un carré tourné), un peu réduit pour garder la même surface qu'un point. */
.goat {
  background: #4fb8e8;
  border-radius: 2px;
  transform: rotate(45deg) scale(0.78);
}
/* À gagner : un point gris, visible sur fond clair comme sur fond sombre. */
.off {
  background: rgba(140, 135, 125, 0.35);
}
</style>
