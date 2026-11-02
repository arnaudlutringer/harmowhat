<template>
  <div class="metronome" :class="{ disabled }">
    <p class="readout" aria-live="polite">
      ♩ = <strong>{{ modelValue }}</strong> <small>{{ tempoName(modelValue) }}</small>
    </p>
    <div class="body">
      <!-- Graduations, du plus lent (en haut) au plus rapide (en bas), comme sur la tige d'un métronome. -->
      <div class="scale" aria-hidden="true">
        <span v-for="t in ticks" :key="t" :style="{ top: `${pos(t)}%` }">{{ t }}</span>
      </div>
      <div
        ref="track"
        class="track"
        role="slider"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="modelValue"
        :aria-valuetext="`${modelValue} à la noire`"
        aria-label="Tempo, à la noire"
        :tabindex="disabled ? -1 : 0"
        @pointerdown="grab"
        @pointermove="drag"
        @pointerup="release"
        @pointercancel="release"
        @keydown.up.prevent="set(modelValue - 1)"
        @keydown.down.prevent="set(modelValue + 1)"
      >
        <span class="rod" />
        <!-- Après la réponse : le bon tempo, en vert. -->
        <span v-if="target !== undefined" class="target" :style="{ top: `${pos(target)}%` }">
          <em>{{ target }}</em>
        </span>
        <span class="weight" :style="{ top: `${pos(modelValue)}%` }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { tempoName } from '@/games/tempo'

/**
 * Curseur vertical façon métronome : le poids glisse sur la tige, lent en haut, rapide en bas.
 * Au clavier, les flèches haut et bas ajustent d'un battement par minute.
 */
const props = defineProps<{ modelValue: number; min: number; max: number; disabled?: boolean; target?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const track = ref<HTMLElement>()
const dragging = ref(false)
const ticks = computed(() => Array.from({ length: Math.floor((props.max - props.min) / 20) + 1 }, (_, i) => props.min + i * 20))
const pos = (t: number) => ((t - props.min) / (props.max - props.min)) * 100

function set(v: number) {
  if (props.disabled) return
  emit('update:modelValue', Math.max(props.min, Math.min(props.max, Math.round(v))))
}

function fromPointer(e: PointerEvent) {
  const r = track.value?.getBoundingClientRect()
  if (!r) return
  set(props.min + ((e.clientY - r.top) / r.height) * (props.max - props.min))
}

function grab(e: PointerEvent) {
  if (props.disabled) return
  dragging.value = true
  track.value?.setPointerCapture(e.pointerId)
  fromPointer(e)
}

function drag(e: PointerEvent) {
  if (dragging.value) fromPointer(e)
}

function release() {
  dragging.value = false
}
</script>

<style scoped>
.metronome {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.readout {
  margin: 0 0 6px;
  font-size: 20px;
}
.readout strong {
  font-size: 34px;
  color: var(--ion-color-primary);
  font-variant-numeric: tabular-nums;
}
.readout small {
  color: var(--ion-color-medium);
  font-style: italic;
}
.body {
  display: flex;
  align-items: stretch;
  gap: 12px;
  height: 220px;
}
.scale {
  position: relative;
  width: 34px;
  font-size: 12px;
  color: var(--ion-color-medium);
}
.scale span {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
}
/* Le corps du métronome : un trapèze, plus large en bas. */
.track {
  position: relative;
  width: 110px;
  background: linear-gradient(180deg, var(--hw-button), var(--hw-button-active));
  clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%);
  touch-action: none;
  cursor: grab;
}
.rod {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 4px;
  transform: translateX(-50%);
  background: var(--ion-text-color);
  opacity: 0.6;
}
.weight {
  position: absolute;
  left: 50%;
  width: 34px;
  height: 22px;
  transform: translate(-50%, -50%);
  background: var(--ion-color-primary);
  clip-path: polygon(15% 0, 85% 0, 100% 100%, 0 100%);
  transition: top 0.05s linear;
}
.target {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  transform: translateY(-50%);
  background: var(--ion-color-success);
}
.target em {
  position: absolute;
  right: 6px;
  top: -18px;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  color: var(--ion-color-success);
}
.disabled .track {
  cursor: default;
}
</style>
