<template>
  <!-- Trophée débloqué : une popin blanche au milieu de l'écran, qui s'envole au bout de 2 s vers « Mes trophées »
       (le bouton marqué data-trophy-target de l'écran, sinon le coin haut droit). -->
  <div v-if="current" class="veil" :class="{ leaving }" aria-live="assertive">
    <!-- Beaucoup de trophées d'un coup : une seule fenêtre qui les liste tous. -->
    <div v-if="group.length" :key="`group-${index}`" ref="popin" class="popin group" :class="{ leaving }" :style="flight">
      <span class="label">{{ group.length }} trophées débloqués&nbsp;!</span>
      <ul>
        <li v-for="(t, i) in group" :key="i">
          <span class="mini" aria-hidden="true"><medal-dot v-if="kindOf(t)" :kind="kindOf(t)!" :size="20" label="" /><template v-else>{{ t.trophy.icon }}</template></span>
          <span>{{ t.trophy.title }}<template v-if="t.tier"> · {{ TIER_LABELS[t.tier].label }}</template></span>
        </li>
      </ul>
    </div>
    <div v-else :key="index" ref="popin" class="popin" :class="{ leaving }" :style="flight">
      <span class="label">Trophée débloqué&nbsp;!</span>
      <span class="icon" aria-hidden="true"><medal-ribbon v-if="medalKind && medalKind !== 'goat'" :kind="medalKind" :size="84" /><template v-else>{{ current.trophy.icon }}</template></span>
      <strong>{{ current.trophy.title }}</strong>
      <span v-if="current.tier" class="tier"><medal-dot kind="goat" :size="13" label="" aria-hidden="true" /> {{ TIER_LABELS[current.tier].label }}</span>
      <small>{{ current.trophy.condition }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { TIER_LABELS, type Tier, type Trophy } from '@/games/trophies'
import MedalDot, { type MedalKind } from './MedalDot.vue'
import MedalRibbon from './MedalRibbon.vue'
import { FLY_MS, GROUP_FROM, GROUP_SHOW_MS, SHOW_MS } from './trophyAnnounce'

/** Trophées à annoncer, un par un (ou tous ensemble s'il y en a beaucoup) ; la liste peut s'allonger pendant l'annonce. */
const props = defineProps<{ queue: { trophy: Trophy; tier?: Tier }[] }>()

const index = ref(0)
const leaving = ref(false)
const running = ref(false)
const popin = ref<HTMLElement>()
const flight = ref<Record<string, string>>({})
const current = computed(() => (running.value ? (props.queue[index.value] ?? null) : null))
/** Médaille de niveau gagnée : son point de couleur à la place de l'emoji. */
const MEDAL_KINDS: Record<string, MedalKind> = { '🥉': 'debutant', '🥈': 'normal', '🥇': 'expert', '👑': 'impossible' }
const kindOf = (t: { trophy: Trophy }) => (t.trophy.id.startsWith('medal-') ? MEDAL_KINDS[t.trophy.icon] : undefined)
const medalKind = computed(() => (current.value ? kindOf(current.value) : undefined))
/** Annonce groupée en cours : les trophées listés ensemble (vide pour une annonce un par un). */
const group = ref<{ trophy: Trophy; tier?: Tier }[]>([])
let timers: ReturnType<typeof setTimeout>[] = []

/** Décalage du centre de la popin jusqu'au bouton « Mes trophées » visible (sinon le coin haut droit). */
function aimAtTarget() {
  const from = popin.value?.getBoundingClientRect()
  const target = [...document.querySelectorAll<HTMLElement>('[data-trophy-target]')]
    .map((el) => el.getBoundingClientRect())
    .find((r) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight)
  if (!from) return
  const to = target ? { x: target.left + target.width / 2, y: target.top + target.height / 2 } : { x: window.innerWidth - 28, y: 30 }
  flight.value = { '--dx': `${to.x - (from.left + from.width / 2)}px`, '--dy': `${to.y - (from.top + from.height / 2)}px` }
}

function play() {
  if (index.value >= props.queue.length) {
    running.value = false
    return
  }
  running.value = true
  leaving.value = false
  flight.value = {}
  // Au départ d'une annonce, beaucoup de trophées d'un coup : tous dans une seule fenêtre.
  const rest = props.queue.slice(index.value)
  group.value = index.value === 0 && rest.length >= GROUP_FROM ? rest : []
  const show = group.value.length ? GROUP_SHOW_MS : SHOW_MS
  timers = [
    setTimeout(() => {
      aimAtTarget()
      leaving.value = true
    }, show),
    setTimeout(() => {
      index.value += group.value.length || 1
      group.value = []
      play()
    }, show + FLY_MS),
  ]
}

watch(
  () => props.queue,
  (queue, previous) => {
    // Une nouvelle liste repart du début ; une liste allongée continue là où elle en était.
    if (previous && queue[0] !== previous[0]) {
      timers.forEach(clearTimeout)
      index.value = 0
      running.value = false
    }
    if (!running.value) play()
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
  background: var(--hw-surface);
  color: var(--ion-text-color);
  box-shadow: 0 12px 40px rgba(45, 48, 71, 0.3);
  text-align: center;
  animation: pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1);
}
/* Envol vers le bouton « Mes trophées » : la popin rapetisse en s'y rangeant. */
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
    transform: translate(var(--dx, calc(50vw - 28px)), var(--dy, calc(-50vh + 30px))) scale(0.08);
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
/* La liste de l'annonce groupée. */
.group ul {
  width: 100%;
  max-height: 55vh;
  margin: 6px 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  text-align: left;
}
.group li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  font-size: 15px;
  font-weight: 600;
}
.group li + li {
  border-top: 1px solid rgba(45, 48, 71, 0.08);
}
.mini {
  flex: none;
  width: 26px;
  display: grid;
  place-items: center;
  font-size: 20px;
}
</style>
