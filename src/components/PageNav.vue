<template>
  <!-- Pas de barre d'en-tête : une flèche de retour et le titre, en haut du contenu. -->
  <div class="page-nav">
    <ion-back-button :default-href="backHref" text="" />
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
import { IonBackButton } from '@ionic/vue'

defineProps<{
  title: string
  /** Écran affiché par la flèche si l'historique est vide. */
  backHref: string
}>()
</script>

<style scoped>
.page-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 480px;
  margin: 0 auto;
}
ion-back-button {
  display: block;
  --color: var(--ion-color-primary);
  margin-left: -12px;
}
h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
</style>
