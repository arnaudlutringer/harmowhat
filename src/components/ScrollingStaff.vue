<template>
  <!-- Portée qui défile : les notes arrivent de la droite, une par temps, et chacune se lit avant d'atteindre la barre violette
       (le joueur peut prendre de l'avance ; ce qui a passé la barre est assombri).
       La clé de la note à lire reste affichée à gauche ; un changement de clé est écrit dans la portée, devant sa note. -->
  <div class="scroller" role="img" :aria-label="label">
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="xMidYMid meet">
      <line v-for="y in lines" :key="y" :x1="CLEF_W" :x2="WIDTH" :y1="y" :y2="y" class="line" />
      <g v-for="n in shown" :key="n.index" :transform="`translate(${n.x}, 0)`" :class="n.state" v-html="n.svg" />
      <rect x="0" y="0" :width="CLEF_W" :height="HEIGHT" class="paper" />
      <line v-for="y in lines" :key="`c${y}`" x1="0" :x2="CLEF_W" :y1="y" :y2="y" class="line" />
      <rect :x="CLEF_W" y="0" :width="LINE_X - CLEF_W" :height="HEIGHT" class="shade" />
      <g v-html="clefSvg" />
      <rect :x="LINE_X - 2" :y="lines[0] - 18" width="4" :height="lines[4] - lines[0] + 36" rx="2" class="reading" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Accidental, BarlineType, Formatter, Renderer, Stave, StaveNote } from 'vexflow/bravura'
import { CLEFS, type ClefId } from '@/games/readNote'
import { vexAccidental, vexKeyOf } from '@/music/spelling'
import type { SightNote } from '@/games/sightReading'

export interface StaffNote {
  index: number
  note: SightNote
  /** À lire, lue (vert), fausse ou oubliée (rouge). */
  state: 'todo' | 'ok' | 'ko'
}

const props = defineProps<{
  notes: StaffNote[]
  /** Avancée du défilement, en temps : la note `i` est sur la barre de lecture quand `position` vaut `i`. */
  position: number
  /** Clé de la note à lire, affichée à gauche. */
  clef: ClefId
  label?: string
}>()

const WIDTH = 320
const HEIGHT = 150
/** Zone de la clé, à gauche. */
const CLEF_W = 52
/** Barre de lecture : la note doit être dite avant de l'atteindre. */
const LINE_X = 96
/** Écart entre deux notes (un temps). */
const SPACING = 68
/** Largeur d'un bloc dessiné par VexFlow (une note, et sa clé si elle change). */
const BLOCK_W = 90
const STAVE_Y = 20

const fontReady = ref(false)
void document.fonts.load('30px Bravura').catch(() => {}).then(() => (fontReady.value = true))

/** Dessine dans un élément hors écran (VexFlow mesure les glyphes) et renvoie le SVG obtenu. */
function render(draw: (renderer: Renderer) => number): { svg: string; offset: number } {
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-9999px;top:0'
  document.body.appendChild(host)
  try {
    const renderer = new Renderer(host, Renderer.Backends.SVG)
    renderer.resize(BLOCK_W, HEIGHT)
    const offset = draw(renderer)
    const svg = host.querySelector('svg')
    svg?.setAttribute('overflow', 'visible')
    return { svg: svg?.outerHTML ?? '', offset }
  } finally {
    host.remove()
  }
}

function stave(x: number, width: number, clef?: ClefId) {
  const s = new Stave(x, STAVE_Y, width)
  s.setBegBarType(BarlineType.NONE).setEndBarType(BarlineType.NONE)
  if (clef) s.addClef(CLEFS[clef].vex)
  return s
}

/** Lignes de la portée (les mêmes que celles de VexFlow). */
const lines = (() => {
  const s = new Stave(0, STAVE_Y, 100)
  return [0, 1, 2, 3, 4].map((i) => s.getYForLine(i))
})()

/** Blocs déjà dessinés, par note (index dans la partie). */
const blocks = new Map<string, { svg: string; offset: number }>()

function blockFor(n: StaffNote, showClef: boolean) {
  const key = `${n.index}:${n.note.fullName}:${n.note.clef}:${showClef}`
  let block = blocks.get(key)
  if (!block) {
    block = render((renderer) => {
      const context = renderer.getContext()
      const s = stave(0, BLOCK_W, showClef ? n.note.clef : undefined)
      s.setContext(context).draw()
      const note = new StaveNote({ keys: [vexKeyOf(n.note.note)], duration: 'w', clef: CLEFS[n.note.clef].vex })
      const acc = vexAccidental(n.note.note)
      if (acc) note.addModifier(new Accidental(acc), 0)
      Formatter.FormatAndDraw(context, s, [note])
      // Milieu de la tête de note : c'est lui qui passe sur la barre de lecture.
      return note.getAbsoluteX() + note.getGlyphWidth() / 2
    })
    if (blocks.size > 60) blocks.clear()
    blocks.set(key, block)
  }
  return block
}

const clefSvgs = new Map<ClefId, string>()
const clefSvg = computed(() => {
  if (!fontReady.value) return ''
  let svg = clefSvgs.get(props.clef)
  if (!svg) {
    svg = render((renderer) => {
      stave(-4, CLEF_W + 8, props.clef).setContext(renderer.getContext()).draw()
      return 0
    }).svg
    clefSvgs.set(props.clef, svg)
  }
  return svg
})

const shown = computed(() => {
  if (!fontReady.value) return []
  const out: { index: number; x: number; svg: string; state: string }[] = []
  props.notes.forEach((n, i) => {
    const x = LINE_X + (n.index - props.position) * SPACING
    if (x < -BLOCK_W || x > WIDTH + 40) return
    // La clé est écrite devant une note quand elle change.
    const before = props.notes[i - 1]
    const block = blockFor(n, !!before && before.note.clef !== n.note.clef)
    out.push({ index: n.index, x: x - block.offset, svg: block.svg, state: n.state })
  })
  return out
})

// Nouvelle partie : les dessins de l'ancienne ne servent plus.
watch(
  () => props.notes[0]?.index,
  (first) => first === 0 && blocks.clear(),
)
</script>

<style scoped>
/* Fond papier, comme les autres portées. */
.scroller {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: #fffdf3;
  color: #222;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
svg {
  display: block;
  width: 100%;
  height: auto;
}
svg :deep(*) {
  fill: currentColor;
  stroke: currentColor;
}
.line {
  stroke-width: 1;
}
/* Les lignes de la portée sont dessinées une seule fois, d'un bout à l'autre : celles de chaque bloc VexFlow,
   qui se superposeraient (et paraîtraient plus épaisses), sont masquées. */
svg :deep(.vf-stave) {
  display: none;
}
svg :deep(rect) {
  stroke: none;
}
svg .paper {
  fill: #fffdf3;
}
/* Hors de la fenêtre de lecture : un peu assombri. */
svg .shade {
  fill: rgba(45, 48, 71, 0.13);
}
svg .reading {
  fill: var(--ion-color-primary);
  opacity: 0.75;
}
svg .ok :deep(.vf-stavenote),
svg .ok :deep(.vf-stavenote *) {
  fill: var(--ion-color-success);
  stroke: var(--ion-color-success);
}
svg .ko :deep(.vf-stavenote),
svg .ko :deep(.vf-stavenote *) {
  fill: var(--ion-color-danger);
  stroke: var(--ion-color-danger);
}
</style>
