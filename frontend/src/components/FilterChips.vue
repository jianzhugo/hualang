<template>
  <div class="flex flex-wrap gap-2 mb-6">
    <button
      v-for="chip in chips"
      :key="chip.value"
      :class="modelValue === chip.value ? 'filter-chip-active' : 'filter-chip'"
      @click="$emit('update:modelValue', chip.value)"
    >
      {{ chip.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Chip {
  label: string
  value: string
}

interface Props {
  modelValue: string
  chips: Chip[]
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
