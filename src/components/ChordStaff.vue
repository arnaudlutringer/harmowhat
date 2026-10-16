<template>
  <div ref="host" class="staff" :aria-label="label" role="img" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import { clefFor } from '@/games/chords'
import { vexAccidental, vexKeyOf, type SpelledNote } from '@/music/spelling'

/**
 * `melodic` : les notes l'une après l'autre (intervalle), sinon ensemble (accord).
 * `clef` : clé VexFlow imposée (treble, bass, alto…) ; par défaut, sol ou fa selon le registre.
 * `correct` : en mode mélodique, indices des notes à colorer en vert (bonne réponse).
 */
const props = defineProps<{ notes: SpelledNote[]; melodic?: boolean; label?: string; clef?: string; correct?: number[] }>()
const host = ref<HTMLDivElement>()

/** Dessine les notes sur une portée, avec la clé imposée ou une clé de sol ou de fa selon le registre. */
async function draw() {
  const el = host.value
  if (!el) return
  // La police musicale (Bravura) est embarquée ; on attend qu'elle soit prête avant de dessiner.
  await document.fonts.load('30px Bravura').catch(() => {})
  el.innerHTML = ''
  const width = 220
  const renderer = new Renderer(el, Renderer.Backends.SVG)
  renderer.resize(width, 150)
  const context = renderer.getContext()
  const clef = props.clef ?? clefFor(props.notes.map((n) => n.midi))
  const stave = new Stave(10, 20, width - 20).addClef(clef)
  stave.setContext(context).draw()

  const groups = props.melodic ? props.notes.map((n) => [n]) : [props.notes]
  const tickables = groups.map((group) => {
    const note = new StaveNote({ keys: group.map(vexKeyOf), duration: props.melodic ? 'h' : 'w', clef })
    group.forEach((n, i) => {
      const acc = vexAccidental(n)
      if (acc) note.addModifier(new Accidental(acc), i)
    })
    return note
  })
  // Mode souple : une mesure incomplète (une seule blanche, en attendant la réponse) est dessinée quand même.
  const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(tickables)
  new Formatter().joinVoices([voice]).format([voice], width - 90)
  voice.draw(context, stave)
  // Bonne réponse en vert : une classe sur le groupe SVG de la note (la couleur vient du style ci-dessous).
  for (const i of props.melodic ? (props.correct ?? []) : []) tickables[i]?.getSVGElement()?.classList.add('correct')

  // Le dessin suit la couleur du texte (thème clair ou sombre).
  const svg = el.querySelector('svg')
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${width} 150`)
    svg.removeAttribute('width')
    svg.removeAttribute('height')
  }
}

onMounted(draw)
watch(() => [props.notes, props.clef, props.correct], draw)
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
/* Note de la bonne réponse : même vert que le bouton de la bonne réponse. */
.staff :deep(svg .correct),
.staff :deep(svg .correct *) {
  fill: var(--ion-color-success);
  stroke: var(--ion-color-success);
}
</style>
