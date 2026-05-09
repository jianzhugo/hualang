<template>
  <div class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
    <div v-for="i in count" :key="i" class="pin-card animate-pulse">
      <div class="bg-surface-card aspect-[3/4] w-full"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number
}
withDefaults(defineProps<Props>(), { count: 8 })
</script>
