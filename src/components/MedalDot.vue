<template>
  <!-- Une médaille en point de couleur : bronze, argent, or, la couronne en violet, et le diamant du GOAT en diamant bleu.
       À gagner : le même contour en pointillés que les places libres d'un classement vide. -->
  <svg
    class="medal-dot"
    :class="[kind, { off: !won }]"
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    role="img"
    :aria-label="label ?? `${NAMES[kind]} ${won ? 'gagnée' : 'à gagner'}`"
  >
    <template v-if="kind === 'goat'">
      <path class="shape" d="M5 2.5h10l4 5.5-9 10-9-10z" />
      <path v-if="won" class="facet" d="M5 2.5h5l-2.5 5.5h-6.5z" />
    </template>
    <circle v-else class="shape" cx="10" cy="10" r="8.5" />
  </svg>
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
  overflow: visible;
}
/* Un contour de la même couleur, aussi épais que le pointillé d'une médaille à gagner : les deux ont la même taille. */
.shape {
  stroke-width: 1.8;
  stroke-linejoin: round;
}
.debutant .shape {
  fill: #cd7f32;
  stroke: #cd7f32;
}
.normal .shape {
  fill: #a3adbb;
  stroke: #a3adbb;
}
.expert .shape {
  fill: #f2c230;
  stroke: #f2c230;
}
.impossible .shape {
  fill: #8e5cf0;
  stroke: #8e5cf0;
}
.goat .shape {
  fill: #4fb8e8;
  stroke: #4fb8e8;
}
/* Une facette plus claire : le diamant se reconnaît d'un coup d'œil. */
.goat .facet {
  fill: #a9e1f8;
}
/* À gagner : un rond (ou un diamant) clair en pointillés, comme les places libres d'un classement vide. */
.off .shape {
  fill: none;
  stroke: var(--ion-color-medium);
  stroke-width: 1.8;
  stroke-dasharray: 3 2.4;
  opacity: 0.7;
}
</style>
