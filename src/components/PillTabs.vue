<template>
  <!-- Onglets en pastilles dans un cadre blanc ; `overlap` : à cheval sur le bas d'un bandeau. -->
  <div class="tabs" :class="{ overlap }" role="tablist">
    <button
      v-for="t in items"
      :key="t.id"
      role="tab"
      :aria-selected="modelValue === t.id"
      :class="{ on: modelValue === t.id }"
      @click="emit('update:modelValue', t.id)"
    >
      {{ t.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
defineProps<{ items: readonly { id: T; label: string }[]; modelValue: T; overlap?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [id: T] }>()
</script>

<style scoped>
.tabs {
  position: relative;
  display: flex;
  max-width: 448px;
  margin: 0 auto;
  padding: 4px;
  border-radius: 16px;
  background: var(--hw-surface, #fff);
  box-shadow: 0 6px 16px rgba(45, 48, 71, 0.1);
}
.tabs.overlap {
  margin: -20px 16px 0;
}
@media (min-width: 480px) {
  .tabs.overlap {
    margin: -20px auto 0;
  }
}
.tabs button {
  flex: 1;
  min-width: 0;
  padding: 9px 4px;
  border: none;
  border-radius: 12px;
  background: none;
  color: var(--ion-color-medium);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.tabs .on {
  background: var(--hw-button-active);
  color: var(--ion-color-primary);
}
</style>
