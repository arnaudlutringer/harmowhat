<template>
  <!-- Écran de lancement : logo, titre et accroche, le temps de charger les scores ; il s'efface en fondu. -->
  <transition name="splash">
    <div v-if="visible" class="splash" role="status" aria-label="Chargement de L'oreille">
      <img class="logo" src="/logo.svg" alt="" />
      <h1>L'oreille</h1>
      <p class="intro">Tu penses avoir l'oreille absolue&nbsp;?<br />Prouve-le&nbsp;!</p>
      <ion-spinner name="dots" color="primary" aria-hidden="true" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue'

defineProps<{ visible: boolean }>()
</script>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  background: var(--ion-background-color);
  text-align: center;
}
.logo {
  width: 120px;
  height: 120px;
  animation: appear 0.6s ease-out;
}
h1 {
  margin: 8px 0 0;
  font-family: 'Dancing Script', cursive;
  font-size: 48px;
  font-weight: 700;
  color: var(--ion-color-primary);
}
.intro {
  margin: 0 0 24px;
  font-family: 'Dancing Script', cursive;
  font-size: 24px;
  font-weight: 600;
  color: var(--ion-color-medium);
}
@keyframes appear {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
}
.splash-leave-active {
  transition: opacity 0.4s ease;
}
.splash-leave-to {
  opacity: 0;
}
</style>
