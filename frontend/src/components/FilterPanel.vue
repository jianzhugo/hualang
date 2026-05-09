<template>
  <div v-if="isOpen" class="filter-bar">
    <div class="filter-bar-content">
      <div class="filter-bar-column">
        <h3 class="filter-bar-label">Tags</h3>
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
        <h3 class="filter-bar-label">Color</h3>
        <div class="filter-bar-color">
          <input
            type="text"
            class="filter-bar-input"
            placeholder="Enter hex or select"
          />
          <div class="filter-bar-color-dots">
            <span
              v-for="color in presetColors"
              :key="color"
              class="filter-bar-color-dot"
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>
      </div>

      <div class="filter-bar-column">
        <h3 class="filter-bar-label">Timeframe</h3>
        <div class="filter-bar-row">
          <div class="filter-bar-date-group">
            <label class="filter-bar-date-label">上传日期</label>
            <div class="filter-bar-row">
              <input
                type="date"
                class="filter-bar-input"
                :value="uploadDateStart"
                @input="$emit('update:uploadDateStart', ($event.target as HTMLInputElement).value)"
              />
              <span class="filter-bar-sep">-</span>
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
            <div class="filter-bar-row">
              <input
                type="date"
                class="filter-bar-input"
                :value="createdDateStart"
                @input="$emit('update:createdDateStart', ($event.target as HTMLInputElement).value)"
              />
              <span class="filter-bar-sep">-</span>
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

      <div class="filter-bar-column">
        <h3 class="filter-bar-label">Uploader</h3>
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
    </div>

    <div class="filter-bar-actions">
      <button class="filter-bar-clear" @click="clearAll">Clear all</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  uploadDateStart: string
  uploadDateEnd: string
  createdDateStart: string
  createdDateEnd: string
  selectedUploaders: string[]
  selectedTags: string[]
  uploaders: string[]
  tags: string[]
}


const emit = defineEmits<{
  'update:uploadDateStart': [value: string]
  'update:uploadDateEnd': [value: string]
  'update:createdDateStart': [value: string]
  'update:createdDateEnd': [value: string]
  'update:selectedUploaders': [value: string[]]
  'update:selectedTags': [value: string[]]
}>()

const presetColors = [
  '#e60023', '#ff6b35', '#f7c948', '#4ecdc4',
  '#45b7d1', '#96ceb4', '#8b5cf6', '#6366f1',
  '#ec4899', '#f472b6', '#000000', '#6b7280'
]

const toggleTag = (tag: string) => {
  const current = props.selectedTags
  const updated = current.includes(tag)
    ? current.filter((t) => t !== tag)
    : [...current, tag]
  emit('update:selectedTags', updated)
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
  emit('update:selectedTags', [])
}

const props = defineProps<Props>()
</script>
