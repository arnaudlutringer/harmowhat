<template>
  <!-- Cadran d'accordeur en demi-cercle, comme un voltmètre : l'aiguille penche à gauche si c'est trop bas, à droite si c'est trop haut. -->
  <div class="gauge" :class="tone" role="img" :aria-label="ariaLabel">
    <svg viewBox="0 0 200 116" aria-hidden="true">
      <path class="track" :d="arc(-100, 100)" />
      <path class="zone" :d="arc(-tolerance, tolerance)" />
      <line
        v-for="t in ticks"
        :key="t"
        class="tick"
        :class="{ major: t % 50 === 0 }"
        v-bind="tickLine(t)"
      />
      <text class="end" x="16" y="112">−</text>
      <text class="end" x="184" y="112">+</text>
      <g class="needle" :style="{ transform: `rotate(${angle}deg)`, opacity: cents === null ? 0.25 : 1 }">
        <line x1="100" y1="100" x2="100" y2="24" />
      </g>
      <circle class="hub" cx="100" cy="100" r="6" />
    </svg>
    <p class="reading">
      <template v-if="label">
        {{ label }}
        <small v-if="cents !== null">{{ cents > 0 ? '+' : '' }}{{ cents }} cents</small>
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Écart en cents (−100 à +100 affichés ; au-delà, l'aiguille reste en butée), ou null sans mesure. */
  cents: number | null
  /** Zone verte de justesse, en cents de part et d'autre du centre. */
  tolerance: number
  /** Note lue, affichée sous le cadran. */
  label?: string
  /** Couleur de l'aiguille : proche (vert), bonne ou mauvaise réponse. */
  tone?: '' | 'near' | 'ok' | 'ko'
}>()

const R = 84
const CX = 100
const CY = 100
/** Angle (degrés, 0 = vertical) pour un écart en cents : ±100 cents aux deux bouts du demi-cercle. */
const angleOf = (c: number) => (Math.max(-100, Math.min(100, c)) / 100) * 90
const point = (c: number, r = R) => {
  const a = (angleOf(c) * Math.PI) / 180
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) }
}

function arc(from: number, to: number) {
  const a = point(from)
  const b = point(to)
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`
}

const ticks = Array.from({ length: 21 }, (_, i) => i * 10 - 100)
function tickLine(c: number) {
  const outer = point(c, R - 8)
  const inner = point(c, c % 50 === 0 ? R - 20 : R - 14)
  return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y }
}

const angle = computed(() => (props.cents === null ? 0 : angleOf(props.cents)))
const ariaLabel = computed(() =>
  props.cents === null ? 'Accordeur' : `${props.label ?? ''} ${props.cents > 0 ? '+' : ''}${props.cents} cents`,
)
</script>

<style scoped>
.gauge {
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
svg {
  width: 100%;
  height: auto;
  overflow: visible;
}
.track {
  fill: none;
  stroke: rgba(108, 92, 231, 0.15);
  stroke-width: 18;
}
/* Zone de justesse acceptée par le niveau. */
.zone {
  fill: none;
  stroke: rgba(0, 168, 132, 0.45);
  stroke-width: 18;
}
.tick {
  stroke: var(--ion-color-medium);
  stroke-width: 1;
}
.tick.major {
  stroke-width: 2;
  stroke: var(--ion-text-color, #333);
}
.end {
  font-size: 16px;
  font-weight: 700;
  fill: var(--ion-color-medium);
  text-anchor: middle;
}
.needle {
  transform-origin: 100px 100px;
  transition: transform 0.12s ease-out;
}
.needle line {
  stroke: var(--ion-color-primary);
  stroke-width: 4;
  stroke-linecap: round;
}
.hub {
  fill: var(--ion-color-primary);
}
.near .needle line,
.ok .needle line,
.near .hub,
.ok .hub {
  stroke: var(--ion-color-success);
  fill: var(--ion-color-success);
}
.ko .needle line,
.ko .hub {
  stroke: var(--ion-color-danger);
  fill: var(--ion-color-danger);
}
.reading {
  min-height: 32px;
  margin: 4px 0 8px;
  font-size: 24px;
  font-weight: 700;
}
.reading small {
  font-size: 15px;
  font-weight: 400;
  color: var(--ion-color-medium);
  margin-left: 6px;
}
</style>
