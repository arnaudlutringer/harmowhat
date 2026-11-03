<template>
  <!-- Rang dans un classement : une pastille numérotée, or, argent ou bronze pour les trois premiers
       (les médailles 🥉🥈🥇 sont réservées aux niveaux réussis des mini-jeux). -->
  <span class="rank" :class="`r${Math.min(rank, 4)}`" :aria-label="`${rank}${rank === 1 ? 'er' : 'e'}`">{{ rank }}</span>
</template>

<script setup lang="ts">
defineProps<{ rank: number }>()
</script>

<style scoped>
.rank {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--ion-color-medium);
  background: var(--hw-button);
}
.r1 {
  color: #fff;
  background: linear-gradient(180deg, #f6c94a, #e9a514);
}
.r2 {
  color: #fff;
  background: linear-gradient(180deg, #c3ccd8, #96a3b4);
}
.r3 {
  color: #fff;
  background: linear-gradient(180deg, #e0a676, #c27a40);
}
</style>
