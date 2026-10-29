<template>
  <!-- Trophée débloqué : une popin blanche au milieu de l'écran, qui s'envole au bout de 2 s vers « Mes trophées » (en haut à droite). -->
  <div v-if="current" class="veil" :class="{ leaving }" aria-live="assertive">
    <div :key="shown" class="popin" :class="{ leaving }">
      <span class="label">Trophée débloqué&nbsp;!</span>
      <span class="icon" aria-hidden="true">{{ current.trophy.icon }}</span>
      <strong>{{ current.trophy.title }}</strong>
      <span v-if="current.tier" class="tier">{{ TIER_LABELS[current.tier].medal }} {{ TIER_LABELS[current.tier].label }}</span>
      <small>{{ current.trophy.condition }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { TIER_LABELS, type Tier, type Trophy } from '@/games/trophies'

const props = defineProps<{ queue: { trophy: Trophy; tier?: Tier }[] }>()

/** Durée d'affichage, puis de l'envol vers « Mes trophées » (ms). */
const SHOW_MS = 2000
const FLY_MS = 700

const shown = ref(0)
const leaving = ref(false)
const current = computed(() => props.queue[shown.value] ?? null)
let timers: ReturnType<typeof setTimeout>[] = []

function play() {
  if (!current.value) return
  leaving.value = false
  timers = [
    setTimeout(() => (leaving.value = true), SHOW_MS),
    setTimeout(() => {
      leaving.value = false
      shown.value++
      play()
    }, SHOW_MS + FLY_MS),
  ]
}

watch(
  () => props.queue,
  () => {
    timers.forEach(clearTimeout)
    shown.value = 0
    play()
  },
  { immediate: true },
)
onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<style scoped>
.veil {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background: rgba(45, 48, 71, 0.25);
  transition: background 0.7s;
  pointer-events: none;
}
.veil.leaving {
  background: transparent;
}
.popin {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: min(80vw, 300px);
  padding: 22px 20px;
  background: #fff;
  color: var(--ion-text-color);
  box-shadow: 0 12px 40px rgba(45, 48, 71, 0.3);
  text-align: center;
  animation: pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1);
}
/* Envol vers le bouton « Mes trophées », en haut à droite : la popin rapetisse en s'y rangeant. */
.popin.leaving {
  animation: fly 0.7s ease-in forwards;
}
@keyframes pop {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes fly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(50vw - 28px), calc(-50vh + 30px)) scale(0.08);
    opacity: 0.2;
  }
}
.label {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ion-color-primary);
}
.icon {
  font-size: 56px;
  line-height: 1.1;
}
strong {
  font-size: 22px;
}
.tier {
  font-size: 15px;
  font-weight: 600;
}
small {
  color: var(--ion-color-medium);
  font-size: 13px;
}
</style>
