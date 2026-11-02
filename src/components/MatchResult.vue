<template>
  <!-- Fin d'une partie de match : publier son défi (celui qui le lance), ou découvrir le résultat (celui qui le relève). -->
  <section v-if="role" class="match">
    <!-- Défi lancé : le publier, ouvert à tous ou entre amis, puis partager son code. -->
    <template v-if="role === 'creator'">
      <template v-if="!created">
        <strong>⚔️ Ton défi est prêt</strong>
        <p>Un autre joueur rejouera exactement les mêmes questions. Le plus de points gagne.</p>
        <div class="choice" role="radiogroup" aria-label="Visibilité du défi">
          <button role="radio" :aria-checked="isPublic" :class="{ on: isPublic }" @click="isPublic = true">🌍 Ouvert à tous</button>
          <button role="radio" :aria-checked="!isPublic" :class="{ on: !isPublic }" @click="isPublic = false">🤝 Entre amis</button>
        </div>
        <ion-button expand="block" :disabled="busy" @click="publish">{{ busy ? 'Publication…' : 'Publier le défi' }}</ion-button>
      </template>
      <template v-else>
        <strong>⚔️ Défi publié</strong>
        <p class="code" aria-label="Code du match">{{ created.code }}</p>
        <p>{{ created.public ? 'Il est dans les matchs ouverts du monde.' : 'Donne ce code à un ami, ou envoie-lui le lien.' }} Tu verras le résultat dans l'écran Matchs.</p>
        <ion-button expand="block" @click="share">{{ copied ? 'Copié !' : 'Partager le défi' }}</ion-button>
        <ion-button expand="block" fill="outline" router-link="/matchs">Voir mes matchs</ion-button>
      </template>
    </template>

    <!-- Défi relevé : le résultat contre celui qui l'a lancé. -->
    <template v-else>
      <template v-if="joined">
        <strong :class="outcome">{{ OUTCOME_TITLES[outcome!] }}</strong>
        <p>
          Tes {{ points.toLocaleString('fr-FR') }} points contre {{ joined.creator_points.toLocaleString('fr-FR') }}
          pour {{ joined.creator_name }}.
        </p>
        <p class="delta">{{ deltaText }}</p>
        <ion-button expand="block" fill="outline" router-link="/matchs">Voir mes matchs</ion-button>
      </template>
      <p v-else-if="error">{{ error }}</p>
      <p v-else>Envoi du résultat…</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton } from '@ionic/vue'
import { createMatch, fetchMatch, joinMatch, outcomeFor, parseCode, RATING_DELTA, shareMatch, type Match } from '@/games/matches'
import { seedFromQuery } from '@/games/seed'
import { profile } from '@/player/profile'
import type { Board } from '@/games/highScores'

const props = defineProps<{ board: Board; points: number; correct: number }>()

const OUTCOME_TITLES = { victoire: '🏆 Victoire !', defaite: '😔 Défaite', nul: '🤝 Match nul' } as const

const route = useRoute()
const seed = seedFromQuery(route.query)
const code = parseCode(String(route.query.match ?? ''))
/** Celui qui a lancé le défi (« defi=1 ») ou celui qui le relève (« match=CODE »). */
const role = seed === undefined ? null : code ? 'opponent' : route.query.defi === '1' ? 'creator' : null

const isPublic = ref(true)
const busy = ref(false)
const created = ref<Match | null>(null)
const copied = ref(false)
const joined = ref<Match | null>(null)
const error = ref('')
const outcome = computed(() => (joined.value ? outcomeFor(joined.value, profile.value.id) : null))
const deltaText = computed(() => {
  const d = outcome.value ? RATING_DELTA[outcome.value] : 0
  return d > 0 ? `+${d} points au classement des matchs` : d < 0 ? `${d} points au classement des matchs` : 'Classement des matchs inchangé'
})

async function publish() {
  if (busy.value || seed === undefined) return
  busy.value = true
  try {
    created.value = await createMatch(props.board, seed, props.points, props.correct, isPublic.value)
  } catch {
    error.value = 'Publication impossible : vérifie ta connexion.'
  } finally {
    busy.value = false
  }
}

async function share() {
  if (!created.value) return
  copied.value = (await shareMatch(created.value).catch(() => 'partage')) === 'copie'
}

// Défi relevé : le résultat part tout de suite, une seule fois.
onMounted(async () => {
  if (role !== 'opponent' || !code) return
  try {
    joined.value = await joinMatch(code, props.points, props.correct)
    if (!joined.value) {
      const m = await fetchMatch(code)
      error.value = !m ? 'Ce match n’existe pas.' : m.creator_id === profile.value.id ? 'C’est ton propre défi : il ne compte pas.' : 'Ce match a déjà été relevé par un autre joueur.'
    }
  } catch {
    error.value = 'Envoi du résultat impossible : vérifie ta connexion.'
  }
})
</script>

<style scoped>
.match {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 24px;
  padding: 16px;
  border-radius: 18px;
  background: var(--hw-surface, #fff);
  box-shadow: 0 4px 14px rgba(45, 48, 71, 0.1);
  text-align: center;
}
.match strong {
  font-size: 18px;
  color: var(--ion-color-primary);
}
.match strong.victoire {
  color: var(--ion-color-success);
}
.match strong.defaite {
  color: var(--ion-color-danger);
}
.match p {
  margin: 0;
  font-size: 14px;
}
.code {
  font-size: 34px !important;
  font-weight: 800;
  letter-spacing: 6px;
  color: var(--ion-color-primary);
}
.delta {
  font-weight: 700;
}
.choice {
  display: flex;
  gap: 8px;
}
.choice button {
  flex: 1;
  padding: 10px 4px;
  border: none;
  border-radius: 14px;
  background: var(--hw-button);
  color: var(--ion-text-color);
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
}
.choice .on {
  background: var(--ion-color-primary);
  color: #fff;
}
</style>
