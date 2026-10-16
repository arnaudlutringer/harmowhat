<template>
  <div ref="host" class="staff" :aria-label="label" role="img" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow/bravura'
import { vexAccidental, vexKeyOf, type SpelledNote } from '@/music/spelling'

/**
 * Une gamme sur une portée en clé de sol, sans armure (les altérations sont sur les notes), en rondes.
 * `steps` : relier deux notes voisines par un arc noir et écrire au-dessus l'écart qui les sépare,
 * « 1 » pour un ton, « ½ » pour un demi-ton ; l'arc et son chiffre suivent la hauteur des notes.
 */
const props = defineProps<{ notes: SpelledNote[]; steps?: boolean; label?: string }>()
const host = ref<HTMLDivElement>()

const WIDTH = 340
const HEIGHT = 170
/** Place laissée au-dessus de la portée pour les arcs et leurs chiffres. */
const STAVE_TOP = 40

async function draw() {
  const el = host.value
  if (!el) return
  // La police musicale (Bravura) est embarquée ; on attend qu'elle soit prête avant de dessiner.
  await document.fonts.load('30px Bravura').catch(() => {})
  el.innerHTML = ''
  const renderer = new Renderer(el, Renderer.Backends.SVG)
  renderer.resize(WIDTH, HEIGHT)
  const context = renderer.getContext()
  const stave = new Stave(6, STAVE_TOP, WIDTH - 12).addClef('treble')
  stave.setContext(context).draw()

  // Des rondes (sans hampe) : la place au-dessus des notes reste libre pour les arcs.
  const notes = props.notes.map((n) => {
    const note = new StaveNote({ keys: [vexKeyOf(n)], duration: 'w', clef: 'treble' })
    const acc = vexAccidental(n)
    if (acc) note.addModifier(new Accidental(acc), 0)
    return note
  })
  const voice = new Voice({ numBeats: notes.length * 4, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(notes)
  new Formatter().joinVoices([voice]).format([voice], WIDTH - 70)
  voice.draw(context, stave)

  // Tons et demi-tons : un arc noir au-dessus de deux notes voisines, le chiffre juste au-dessus de l'arc.
  if (props.steps) {
    context.setFont('Fredoka Variable, sans-serif', 13, 'bold')
    for (let i = 1; i < notes.length; i++) {
      const [a, b] = [notes[i - 1], notes[i]]
      const xa = (a.getNoteHeadBeginX() + a.getNoteHeadEndX()) / 2
      const xb = (b.getNoteHeadBeginX() + b.getNoteHeadEndX()) / 2
      // Au-dessus de la tête de note ; plus haut à l'arrivée si la note porte une altération, pour ne pas la couper.
      const ya = a.getYs()[0] - 8
      const yb = b.getYs()[0] - (props.notes[i].alter ? 16 : 8)
      const peak = Math.min(ya, yb) - 16
      const xm = (xa + xb) / 2
      context.openGroup('step-arc')
      context.beginPath()
      context.moveTo(xa + 3, ya)
      context.quadraticCurveTo(xm, peak, xb - 3, yb)
      context.stroke()
      context.closeGroup()
      // Sommet de l'arc (courbe quadratique) : (ya + 2 × peak + yb) / 4 ; le chiffre est posé juste au-dessus.
      const semitones = props.notes[i].midi - props.notes[i - 1].midi
      const text = semitones === 1 ? '½' : semitones === 2 ? '1' : `${semitones / 2}`
      context.fillText(text, xm - 3.5, (ya + 2 * peak + yb) / 4 - 4)
    }
  }

  const svg = el.querySelector('svg')
  if (svg) {
    svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
    svg.removeAttribute('width')
    svg.removeAttribute('height')
  }
}

onMounted(draw)
watch(() => [props.notes, props.steps], draw)
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
.staff :deep(svg rect),
.staff :deep(svg text) {
  stroke: none;
}
/* Arcs des tons et demi-tons : un trait arrondi, sans remplissage. */
.staff :deep(svg .vf-step-arc path) {
  fill: none;
  stroke-width: 1.4;
  stroke-linecap: round;
}
</style>
