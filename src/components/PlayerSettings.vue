<template>
  <!-- Onglet Joueur des paramètres : nom et pays qui accompagnent les scores dans le classement mondial. -->
  <div class="player hw-square">
    <p class="hint">Ton nom et ton pays accompagnent tes scores dans le classement mondial.</p>

    <ion-input
      :value="name"
      :maxlength="MAX_NAME_LENGTH"
      label="Nom"
      label-placement="stacked"
      fill="outline"
      placeholder="10 caractères au plus"
      autocapitalize="words"
      @ion-input="setName(String($event.detail.value ?? ''))"
      @ion-blur="name = cleanName(name)"
    />

    <h2>Pays</h2>
    <button class="current" @click="picking = true">
      <span class="flag" aria-hidden="true">{{ current?.flag }}</span>
      <span class="country-name">{{ current?.name }}</span>
      <span class="change">Changer</span>
    </button>

    <!-- Identifiant technique : reconnaît les scores du joueur même s'il change de nom ou de pays. -->
    <div class="player-id">
      <span>Identifiant joueur</span>
      <code>{{ profile.id }}</code>
      <button class="copy" @click="copyId">{{ copied ? 'Copié ✓' : 'Copier' }}</button>
    </div>

    <!-- Choix du pays : recherche par nom, puis la liste des pays avec leur drapeau. -->
    <ion-modal :is-open="picking" @did-dismiss="closePicker">
      <ion-header>
        <ion-toolbar>
          <ion-title>Ton pays</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="picking = false">Fermer</ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar v-model="query" placeholder="Rechercher un pays" :debounce="100" />
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list lines="full">
          <ion-item
            v-for="c in results"
            :key="c.code"
            button
            :detail="false"
            :class="{ chosen: c.code === profile.country }"
            @click="pick(c.code)"
          >
            <span slot="start" class="flag" aria-hidden="true">{{ c.flag }}</span>
            <ion-label>{{ c.name }}</ion-label>
            <ion-icon v-if="c.code === profile.country" slot="end" :icon="checkmark" color="primary" />
          </ion-item>
        </ion-list>
        <p v-if="!results.length" class="none">Aucun pays ne correspond.</p>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonModal, IonSearchbar, IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { checkmark } from 'ionicons/icons'
import { countryByCode, searchCountries, type CountryCode } from '@/player/countries'
import { profile, saveProfile } from '@/player/profile'
import { cleanName, MAX_NAME_LENGTH } from '@/games/highScores'

// Le nom est enregistré à chaque frappe (nettoyé : espaces en trop retirés) ; le champ garde ce que le joueur tape.
const name = ref(profile.value.name)
function setName(value: string) {
  name.value = value
  saveProfile({ name: cleanName(value) })
}

const current = computed(() => countryByCode(profile.value.country))

const picking = ref(false)
const query = ref('')
const results = computed(() => searchCountries(query.value))

function pick(code: CountryCode) {
  saveProfile({ country: code })
  picking.value = false
}

function closePicker() {
  picking.value = false
  query.value = ''
}

const copied = ref(false)
async function copyId() {
  try {
    await navigator.clipboard.writeText(profile.value.id)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Presse-papiers indisponible : l'identifiant reste sélectionnable à la main.
  }
}
</script>

<style scoped>
.hint {
  color: var(--ion-color-medium);
  margin: 0 0 20px;
}
h2 {
  margin: 28px 0 10px;
  font-size: 18px;
}
.current {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  background: var(--hw-button);
  color: var(--hw-button-text);
  box-shadow: 0 2px 0 rgba(108, 92, 231, 0.35), 0 4px 10px rgba(45, 48, 71, 0.08);
  font-size: 17px;
  text-align: left;
  cursor: pointer;
}
.flag {
  font-size: 28px;
  line-height: 1;
}
.country-name {
  flex: 1;
  font-weight: 600;
}
.change {
  color: var(--ion-color-primary);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}
.player-id {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin-top: 32px;
  font-size: 12px;
  color: var(--ion-color-medium);
}
.player-id span {
  width: 100%;
}
.player-id code {
  user-select: all;
  font-size: 12px;
  word-break: break-all;
}
.player-id .copy {
  padding: 2px 8px;
  border: 1px solid rgba(var(--ion-color-primary-rgb), 0.35);
  border-radius: 12px;
  background: transparent;
  color: var(--ion-color-primary);
  font-size: 12px;
  cursor: pointer;
}
ion-item .flag {
  margin-right: 4px;
}
ion-item.chosen {
  --background: var(--hw-button-active);
  font-weight: 700;
}
.none {
  text-align: center;
  color: var(--ion-color-medium);
}
</style>
