<template>
  <ion-page>
    <ion-content class="ion-padding">
      <page-nav title="Matchs" />
      <div class="matches">
        <div class="tabs" role="tablist">
          <button v-for="t in TABS" :key="t.id" role="tab" :aria-selected="tab === t.id" :class="{ on: tab === t.id }" @click="tab = t.id">
            {{ t.label }}
            <i v-if="t.id === 'mes' && unseenResults" class="dot" aria-label="Nouveaux résultats" />
          </button>
        </div>

        <p v-if="!matchesAvailable" class="empty">Les matchs ont besoin du classement mondial, qui n'est pas configuré.</p>
        <p v-else-if="error" class="empty">{{ error }}</p>

        <!-- Mes matchs : ceux que j'ai lancés (en attente ou terminés) et ceux que j'ai relevés. -->
        <template v-else-if="tab === 'mes'">
          <p class="how">Lance un défi depuis les réglages d'un jeu (bouton ⚔️ Défier).</p>
          <p v-if="loading" class="empty">Chargement…</p>
          <p v-else-if="!mine.length" class="empty">Pas encore de match.</p>
          <div v-for="m in mine" :key="m.code" class="card" :class="{ fresh: freshCodes.includes(m.code) }">
            <ion-icon class="game" :icon="GAME_ICONS[m.game]" aria-hidden="true" />
            <div class="text">
              <strong>{{ GAMES[m.game].title }} <small>· {{ levelLabel(boardOf(m)) }}</small></strong>
              <span v-if="!m.opponent_id">En attente d'un adversaire · code <b>{{ m.code }}</b>{{ m.public ? '' : ' (entre amis)' }}</span>
              <span v-else>
                {{ opponentOf(m) }} :
                {{ myPoints(m).toLocaleString('fr-FR') }} à {{ theirPoints(m).toLocaleString('fr-FR') }}
              </span>
            </div>
            <span v-if="m.opponent_id" class="outcome" :class="outcomeFor(m, profile.id)!">{{ OUTCOME_SHORT[outcomeFor(m, profile.id)!] }}</span>
            <ion-button v-else fill="clear" size="small" aria-label="Partager le défi" @click="shareMatch(m)">
              <ion-icon slot="icon-only" :icon="shareSocialOutline" />
            </ion-button>
          </div>
        </template>

        <!-- Relever un défi : avec un code, ou parmi les matchs ouverts du monde. -->
        <template v-else-if="tab === 'relever'">
          <form class="code" @submit.prevent="openCode">
            <ion-input v-model="code" label="Code d'un ami" label-placement="stacked" fill="outline" placeholder="ABC123" :maxlength="6" autocapitalize="characters" />
            <ion-button type="submit" :disabled="!parseCode(code)">Jouer</ion-button>
          </form>
          <p v-if="codeError" class="error">{{ codeError }}</p>
          <h2>Matchs ouverts</h2>
          <p v-if="loading" class="empty">Chargement…</p>
          <p v-else-if="!open.length" class="empty">Aucun match ouvert pour l'instant.</p>
          <button v-for="m in open" :key="m.code" class="card play" @click="play(m)">
            <ion-icon class="game" :icon="GAME_ICONS[m.game]" aria-hidden="true" />
            <div class="text">
              <strong>{{ GAMES[m.game].title }} <small>· {{ levelLabel(boardOf(m)) }}</small></strong>
              <span>{{ flagOf(m.creator_country) }} {{ m.creator_name }} · {{ m.creator_points.toLocaleString('fr-FR') }} pts à battre</span>
            </div>
            <span class="go">⚔️</span>
          </button>
        </template>

        <!-- Classement des matchs : 1 000 au départ, +20 par victoire, −10 par défaite. -->
        <template v-else>
          <p class="how">1 000 points au départ, +20 par victoire, 0 par match nul, −10 par défaite.</p>
          <p v-if="loading" class="empty">Chargement…</p>
          <p v-else-if="!ranking.length" class="empty">Pas encore de match terminé.</p>
          <ol class="ranking">
            <li v-for="(r, i) in ranking" :key="r.player_id" :class="{ me: r.player_id === profile.id }">
              <span class="rank">{{ ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.` }}</span>
              <span class="name">{{ flagOf(r.country) }} {{ r.name }} <small>{{ r.wins }} V · {{ r.played }} matchs</small></span>
              <strong>{{ r.rating }}</strong>
            </li>
          </ol>
        </template>
      </div>
    </ion-content>
    <bottom-nav active="/matchs" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonButton, IonContent, IonIcon, IonInput, IonPage, onIonViewWillEnter, useIonRouter } from '@ionic/vue'
import { shareSocialOutline } from 'ionicons/icons'
import PageNav from '@/components/PageNav.vue'
import BottomNav from '@/components/BottomNav.vue'
import { GAMES, levelLabel } from '@/games/highScores'
import { GAME_ICONS } from '@/games/icons'
import { countryByCode } from '@/player/countries'
import { profile } from '@/player/profile'
import {
  boardOf, fetchMatch, fetchRanking, markSeen, matchesAvailable, matchHref, myMatches, openMatches, outcomeFor, parseCode,
  shareMatch, unseenCodes, unseenResults, type Match, type RankingRow,
} from '@/games/matches'

const TABS = [
  { id: 'mes', label: 'Mes matchs' },
  { id: 'relever', label: 'Relever' },
  { id: 'classement', label: 'Classement' },
] as const
const OUTCOME_SHORT = { victoire: 'Gagné', defaite: 'Perdu', nul: 'Nul' } as const

const route = useRoute()
const router = useIonRouter()
const tab = ref<'mes' | 'relever' | 'classement'>(route.query.onglet === 'relever' ? 'relever' : 'mes')
const loading = ref(false)
const error = ref('')
const mine = ref<Match[]>([])
const open = ref<Match[]>([])
const ranking = ref<RankingRow[]>([])
/** Résultats pas encore vus à l'arrivée : mis en avant, puis marqués comme vus. */
const freshCodes = ref<string[]>([])
const code = ref(String(route.query.code ?? ''))
const codeError = ref('')

const flagOf = (c: string) => countryByCode(c)?.flag ?? ''
const isMine = (m: Match) => m.creator_id === profile.value.id
const myPoints = (m: Match) => (isMine(m) ? m.creator_points : (m.opponent_points ?? 0))
const theirPoints = (m: Match) => (isMine(m) ? (m.opponent_points ?? 0) : m.creator_points)
const opponentOf = (m: Match) => (isMine(m) ? `${flagOf(m.opponent_country ?? '')} ${m.opponent_name}` : `${flagOf(m.creator_country)} ${m.creator_name}`)

async function load() {
  if (!matchesAvailable) return
  loading.value = true
  error.value = ''
  try {
    if (tab.value === 'mes') {
      mine.value = await myMatches()
      freshCodes.value = unseenCodes(mine.value)
      markSeen(mine.value)
    } else if (tab.value === 'relever') open.value = await openMatches()
    else ranking.value = await fetchRanking()
  } catch {
    error.value = 'Connexion impossible : réessaie plus tard.'
  } finally {
    loading.value = false
  }
}

watch(tab, load)
onIonViewWillEnter(load)

function play(m: Match) {
  router.push(matchHref(m))
}

async function openCode() {
  const c = parseCode(code.value)
  if (!c) return
  codeError.value = ''
  try {
    const m = await fetchMatch(c)
    if (!m) codeError.value = 'Aucun match avec ce code.'
    else if (m.creator_id === profile.value.id) codeError.value = 'C’est ton propre défi : envoie le code à un ami.'
    else if (m.opponent_id) codeError.value = 'Ce match a déjà été relevé.'
    else play(m)
  } catch {
    codeError.value = 'Connexion impossible : réessaie plus tard.'
  }
}

// Lien direct ou code dans l'adresse (« /matchs?onglet=relever&code=ABC123 ») : on ouvre le match tout de suite.
if (parseCode(code.value)) void openCode()
</script>

<style scoped>
.matches {
  max-width: 480px;
  margin: 0 auto;
}
.tabs {
  display: flex;
  margin: 12px 0 8px;
  padding: 4px;
  border-radius: 16px;
  background: var(--hw-surface, #fff);
  box-shadow: 0 4px 12px rgba(45, 48, 71, 0.08);
}
.tabs button {
  position: relative;
  flex: 1;
  padding: 9px 0;
  border: none;
  border-radius: 12px;
  background: none;
  color: var(--ion-color-medium);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.tabs .on {
  background: var(--hw-button-active);
  color: var(--ion-color-primary);
}
.dot {
  position: absolute;
  top: 6px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ion-color-danger);
}
.how,
.empty {
  color: var(--ion-color-medium);
  font-size: 14px;
}
.error {
  color: var(--ion-color-danger);
  font-size: 14px;
}
h2 {
  margin: 18px 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ion-color-medium);
}
.card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  padding: 10px 12px;
  border: none;
  border-radius: 16px;
  background: var(--hw-surface, #fff);
  color: var(--ion-text-color);
  font-family: inherit;
  text-align: left;
  box-shadow: 0 2px 8px rgba(45, 48, 71, 0.07);
}
.card.play {
  cursor: pointer;
}
.card.fresh {
  outline: 2px solid var(--ion-color-primary);
}
.card .game {
  flex: none;
  font-size: 30px;
}
.text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.text small,
.text span {
  font-size: 12px;
  color: var(--ion-color-medium);
}
.outcome {
  font-weight: 700;
}
.outcome.victoire {
  color: var(--ion-color-success);
}
.outcome.defaite {
  color: var(--ion-color-danger);
}
.outcome.nul {
  color: var(--ion-color-medium);
}
.go {
  font-size: 22px;
}
.code {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: 8px;
}
.code ion-input {
  flex: 1;
  text-transform: uppercase;
}
.ranking {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ranking li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--hw-surface, #fff);
}
.ranking li.me {
  outline: 2px solid var(--ion-color-primary);
}
.ranking .rank {
  width: 26px;
  text-align: center;
}
.ranking .name {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ranking small {
  font-size: 11px;
  color: var(--ion-color-medium);
}
</style>
