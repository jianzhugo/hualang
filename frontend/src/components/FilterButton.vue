<template>
  <div class="filter-trigger" :class="{ 'filter-trigger-active': isOpen }">
    <button class="filter-trigger-btn" @click="toggle">
      <Funnel class="filter-trigger-icon" />
      <span>筛选</span>
      <span v-if="activeFilterCount > 0" class="filter-trigger-badge">{{ activeFilterCount }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Funnel } from 'lucide-vue-next'

interface Props {
  uploadDateStart: string
  uploadDateEnd: string
  createdDateStart: string
  createdDateEnd: string
  selectedUploaders: string[]
  selectedTags: string[]
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const activeFilterCount = computed(() => {
  let count = 0
  if (props.uploadDateStart || props.uploadDateEnd) count++
  if (props.createdDateStart || props.createdDateEnd) count++
  count += props.selectedUploaders.length
  count += props.selectedTags.length
  return count
})

const toggle = () => {
  emit('update:isOpen', !props.isOpen)
}
</script>
