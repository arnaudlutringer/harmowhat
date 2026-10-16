<template>
  <!-- Classement affiché : le monde, le pays du joueur ou cet appareil (le monde et le pays seulement si la base est configurée). -->
  <ion-segment v-if="worldEnabled" :value="scope" class="scope" @ion-change="scope = $event.detail.value as Scope">
    <ion-segment-button value="monde">
      <ion-label>🌍 Monde</ion-label>
    </ion-segment-button>
    <ion-segment-button value="pays">
      <ion-label>{{ flag(profile.country) }} {{ countryByCode(profile.country)?.name }}</ion-label>
    </ion-segment-button>
    <ion-segment-button value="appareil">
      <ion-label>📱 Appareil</ion-label>
    </ion-segment-button>
  </ion-segment>
</template>

<script setup lang="ts">
import { IonLabel, IonSegment, IonSegmentButton } from '@ionic/vue'
import { scope, worldEnabled, type Scope } from '@/games/worldScores'
import { countryByCode, flag } from '@/player/countries'
import { profile } from '@/player/profile'
</script>

<style scoped>
.scope {
  margin: 0 0 16px;
}
.scope ion-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: none;
}
</style>
