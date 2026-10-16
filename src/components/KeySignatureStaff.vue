<template>
  <div ref="host" class="staff" :aria-label="label" role="img" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Renderer, Stave } from 'vexflow/bravura'

/** Portée avec une clé (VexFlow : treble, bass, alto…) et une armure (tonalité majeure VexFlow : « F# », « Bb », « C »). */
const props = defineProps<{ clef: string; keySpec: string; label?: string }>()
const host = ref<HTMLDivElement>()

const WIDTH = 260
const HEIGHT = 150

async function draw() {
  const el = host.value
  if (!el) return
  // La police musicale (Bravura) est embarquée ; on attend qu'elle soit prête avant de dessiner.
  await document.fonts.load('30px Bravura').catch(() => {})
  el.innerHTML = ''
  const renderer = new Renderer(el, Renderer.Backends.SVG)
  renderer.resize(WIDTH, HEIGHT)
  const context = renderer.getContext()
  new Stave(10, 20, WIDTH - 20).addClef(props.clef).addKeySignature(props.keySpec).setContext(context).draw()
  const svg = el.querySelector('svg')
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    svg.removeAttribute('width')
    svg.removeAttribute('height')
  }
}

onMounted(draw)
watch(() => [props.clef, props.keySpec], draw)
</script>

<style scoped>
.staff {
  width: 100%;
  color: var(--ion-text-color, #000);
}
.staff :deep(svg) {
  width: 100%;
  height: auto;
}
.staff :deep(svg *) {
  fill: currentColor;
  stroke: currentColor;
}
.staff :deep(svg rect) {
  stroke: none;
}
</style>
