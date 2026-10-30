<template>
  <div ref="host" class="staff" :class="{ compact }" :aria-label="label" role="img" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Beam, Dot, Formatter, Renderer, Stave, StaveNote, Tuplet, Voice } from 'vexflow/bravura'
import { CELLS, type CellId } from '@/games/rhythm'

/**
 * Rythme sur une portée de percussion (une ligne de notes, sans hauteur) : une cellule par temps.
 * `compact` : une seule cellule, sans clé ni chiffrage (boutons de réponse).
 * `correct` / `wrong` : temps (index des cellules) à colorer en vert ou en rouge.
 */
const props = defineProps<{ cells: readonly CellId[]; compact?: boolean; label?: string; correct?: number[]; wrong?: number[] }>()
const host = ref<HTMLDivElement>()

async function draw() {
  const el = host.value
  if (!el) return
  await document.fonts.load('30px Bravura').catch(() => {})
  el.innerHTML = ''
  const width = props.compact ? 110 : 300
  const height = props.compact ? 90 : 120
  const renderer = new Renderer(el, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()
  const stave = new Stave(props.compact ? 0 : 6, props.compact ? 0 : 10, width - (props.compact ? 0 : 12), { numLines: 1 })
  if (!props.compact) stave.addClef('percussion').addTimeSignature(`${props.cells.length}/4`)
  stave.setContext(context).draw()

  const groups = props.cells.map((id) => {
    const cell = CELLS[id]
    const notes = cell.vex.map((d) => {
      const note = new StaveNote({ keys: ['b/4'], duration: d.replace('d', ''), clef: 'percussion', autoStem: false })
      if (d.includes('d')) Dot.buildAndAttach([note], { all: true })
      return note
    })
    const beamable = notes.filter((n, i) => !cell.vex[i].endsWith('r') && /^(8|16)/.test(cell.vex[i]))
    return { notes, beams: beamable.length > 1 ? [new Beam(beamable)] : [], tuplets: cell.tuplet ? [new Tuplet(notes)] : [] }
  })
  const tickables = groups.flatMap((g) => g.notes)
  const voice = new Voice({ numBeats: props.cells.length, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(tickables)
  new Formatter().joinVoices([voice]).format([voice], width - (props.compact ? 30 : 110))
  voice.draw(context, stave)
  for (const g of groups) {
    g.beams.forEach((b) => b.setContext(context).draw())
    g.tuplets.forEach((t) => t.setContext(context).draw())
  }

  // Couleur d'un temps : sur ses notes, ses ligatures et son triolet (la couleur vient du style ci-dessous).
  const mark = (beats: number[] | undefined, cls: string) => {
    for (const i of beats ?? []) {
      const g = groups[i]
      if (!g) continue
      for (const item of [...g.notes, ...g.beams, ...g.tuplets]) item.getSVGElement()?.classList.add(cls)
    }
  }
  mark(props.correct, 'correct')
  mark(props.wrong, 'wrong')

  const svg = el.querySelector('svg')
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    // VexFlow fixe aussi la taille en style : la portée suit la largeur de son conteneur.
    svg.style.width = ''
    svg.style.height = ''
  }
}

onMounted(draw)
watch(() => [props.cells, props.correct, props.wrong], draw)
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
.staff :deep(svg .correct),
.staff :deep(svg .correct *) {
  fill: var(--ion-color-success);
  stroke: var(--ion-color-success);
}
.staff :deep(svg .wrong),
.staff :deep(svg .wrong *) {
  fill: var(--ion-color-danger);
  stroke: var(--ion-color-danger);
}
</style>
