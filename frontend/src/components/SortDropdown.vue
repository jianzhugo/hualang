<template>
  <div class="sort-select">
    <button class="sort-select-trigger" @click="isOpen = !isOpen">
      <span>{{ currentLabel }}</span>
      <ChevronDown class="sort-select-arrow" :class="{ 'sort-select-arrow-open': isOpen }" />
    </button>

    <div v-if="isOpen" class="sort-select-menu">
      <button
        v-for="option in sortOptions"
        :key="option.value"
        class="sort-select-item"
        :class="{ 'sort-select-item-active': modelValue === option.value }"
        @click="selectSort(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface SortOption {
  label: string
  value: string
}

const sortOptions: SortOption[] = [
  { label: '上传日期 ↑', value: 'uploadDate-asc' },
  { label: '上传日期 ↓', value: 'uploadDate-desc' },
  { label: '创作日期 ↑', value: 'createdDate-asc' },
  { label: '创作日期 ↓', value: 'createdDate-desc' }
]

interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const currentLabel = computed(() => {
  const option = sortOptions.find((o) => o.value === props.modelValue)
  return option ? option.label : '排序'
})

const selectSort = (value: string) => {
  emit('update:modelValue', value)
  isOpen.value = false
}

const closeOnClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.sort-select')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOnClickOutside)
})
</script>
