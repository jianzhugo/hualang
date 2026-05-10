<template>
  <div v-if="isOpen" ref="panelRef" class="filter-bar">
    <div class="filter-bar-content">
      <div class="filter-bar-column">
        <h3 class="filter-bar-label">标签</h3>
        <div class="filter-bar-tags">
          <button
            v-for="tag in tags"
            :key="tag"
            class="filter-bar-tag"
            :class="{ 'filter-bar-tag-active': selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
          <span v-if="tags.length === 0" class="filter-bar-empty">暂无标签</span>
        </div>
      </div>

      <div class="filter-bar-column">
        <h3 class="filter-bar-label">作者</h3>
        <div class="filter-bar-tags">
          <button
            v-for="author in authors"
            :key="author"
            class="filter-bar-tag"
            :class="{ 'filter-bar-tag-active': selectedAuthors.includes(author) }"
            @click="toggleAuthor(author)"
          >
            {{ author }}
          </button>
          <span v-if="authors.length === 0" class="filter-bar-empty">暂无作者</span>
        </div>
      </div>

      <div class="filter-bar-column">
        <h3 class="filter-bar-label">上传者</h3>
        <div class="filter-bar-tags">
          <button
            v-for="uploader in uploaders"
            :key="uploader"
            class="filter-bar-tag"
            :class="{ 'filter-bar-tag-active': selectedUploaders.includes(uploader) }"
            @click="toggleUploader(uploader)"
          >
            {{ uploader }}
          </button>
          <span v-if="uploaders.length === 0" class="filter-bar-empty">暂无上传者</span>
        </div>
      </div>

      <div class="filter-bar-column filter-bar-full-width">
        <h3 class="filter-bar-label">时间范围</h3>
        <div class="filter-bar-date-groups">
          <div class="filter-bar-date-group">
            <label class="filter-bar-date-label">上传日期</label>
            <div class="filter-bar-date-inputs">
              <input
                type="date"
                class="filter-bar-input"
                :value="uploadDateStart"
                @input="$emit('update:uploadDateStart', ($event.target as HTMLInputElement).value)"
              />
              <span class="filter-bar-sep">至</span>
              <input
                type="date"
                class="filter-bar-input"
                :value="uploadDateEnd"
                @input="$emit('update:uploadDateEnd', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="filter-bar-date-group">
            <label class="filter-bar-date-label">创作日期</label>
            <div class="filter-bar-date-inputs">
              <input
                type="date"
                class="filter-bar-input"
                :value="createdDateStart"
                @input="$emit('update:createdDateStart', ($event.target as HTMLInputElement).value)"
              />
              <span class="filter-bar-sep">至</span>
              <input
                type="date"
                class="filter-bar-input"
                :value="createdDateEnd"
                @input="$emit('update:createdDateEnd', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-bar-actions">
      <button class="filter-bar-clear" @click="clearAll">清除全部</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  isOpen: boolean
  uploadDateStart: string
  uploadDateEnd: string
  createdDateStart: string
  createdDateEnd: string
  selectedUploaders: string[]
  selectedAuthors: string[]
  selectedTags: string[]
  uploaders: string[]
  authors: string[]
  tags: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:uploadDateStart': [value: string]
  'update:uploadDateEnd': [value: string]
  'update:createdDateStart': [value: string]
  'update:createdDateEnd': [value: string]
  'update:selectedUploaders': [value: string[]]
  'update:selectedAuthors': [value: string[]]
  'update:selectedTags': [value: string[]]
  close: []
}>()

const panelRef = ref<HTMLElement>()

const handleClickOutside = (e: MouseEvent) => {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleTag = (tag: string) => {
  const current = props.selectedTags
  const updated = current.includes(tag)
    ? current.filter((t) => t !== tag)
    : [...current, tag]
  emit('update:selectedTags', updated)
}

const toggleAuthor = (author: string) => {
  const current = props.selectedAuthors
  const updated = current.includes(author)
    ? current.filter((a) => a !== author)
    : [...current, author]
  emit('update:selectedAuthors', updated)
}

const toggleUploader = (uploader: string) => {
  const current = props.selectedUploaders
  const updated = current.includes(uploader)
    ? current.filter((u) => u !== uploader)
    : [...current, uploader]
  emit('update:selectedUploaders', updated)
}

const clearAll = () => {
  emit('update:uploadDateStart', '')
  emit('update:uploadDateEnd', '')
  emit('update:createdDateStart', '')
  emit('update:createdDateEnd', '')
  emit('update:selectedUploaders', [])
  emit('update:selectedAuthors', [])
  emit('update:selectedTags', [])
}
</script>
