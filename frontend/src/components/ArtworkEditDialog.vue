<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click="handleBackdropClick"
    >
      <div class="absolute inset-0 bg-black/50"></div>

      <div
        class="relative z-10 w-full max-w-xl min-w-[320px] mx-4 bg-white rounded-lg p-6"
        @click.stop
      >
        <h2 class="text-heading-lg font-semibold text-ink mb-4">编辑作品信息</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-body-sm font-semibold text-ink mb-2">作品标题</label>
            <input v-model="editForm.title" type="text" class="text-input" />
          </div>

          <div class="edit-dropdown-wrapper">
            <label class="block text-body-sm font-semibold text-ink mb-2">上传者</label>
            <input
              v-model="editForm.uploader"
              type="text"
              class="text-input"
              @focus="showUploaderDropdown = true"
              @input="showUploaderDropdown = true"
              @blur="handleUploaderBlur"
            />
            <ul v-if="showUploaderDropdown && filteredUploaders.length > 0" class="edit-dropdown-list">
              <li
                v-for="uploader in filteredUploaders"
                :key="uploader"
                class="edit-dropdown-item"
                @mousedown.prevent="selectUploader(uploader)"
              >
                {{ uploader }}
              </li>
            </ul>
          </div>

          <div class="edit-dropdown-wrapper">
            <label class="block text-body-sm font-semibold text-ink mb-2">作品作者</label>
            <input
              v-model="editForm.author"
              type="text"
              class="text-input"
              @focus="showAuthorDropdown = true"
              @input="showAuthorDropdown = true"
              @blur="handleAuthorBlur"
            />
            <ul v-if="showAuthorDropdown && filteredAuthors.length > 0" class="edit-dropdown-list">
              <li
                v-for="author in filteredAuthors"
                :key="author"
                class="edit-dropdown-item"
                @mousedown.prevent="selectAuthor(author)"
              >
                {{ author }}
              </li>
            </ul>
          </div>

          <div>
            <label class="block text-body-sm font-semibold text-ink mb-2">创作日期</label>
            <input v-model="editForm.createdDate" type="date" class="text-input" />
          </div>

          <div>
            <label class="block text-body-sm font-semibold text-ink mb-2">标签</label>
            <div class="flex gap-2 mb-2">
              <input
                v-model="tagInput"
                type="text"
                placeholder="输入标签后按回车"
                class="flex-1 min-w-0 h-[44px] px-[15px] text-body-md border border-ash rounded-md bg-canvas text-ink outline-none transition-colors duration-150 focus:border-ink"
                @keyup.enter="addTag"
              />
              <button type="button" class="btn-secondary" @click="addTag">添加</button>
            </div>
            <div v-if="existingTags.length > 0" class="mb-2">
              <p class="text-caption-sm text-mute mb-1">已有标签（点击快速添加）：</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="tag in displayedExistingTags"
                  :key="tag"
                  type="button"
                  class="tag-btn"
                  :class="{ 'opacity-40': editForm.tags.includes(tag) }"
                  :disabled="editForm.tags.includes(tag)"
                  @click="addExistingTag(tag)"
                >
                  {{ tag }}
                </button>
                <button
                  v-if="existingTags.length > maxVisibleTags"
                  type="button"
                  class="px-2 py-0.5 text-caption-sm text-primary hover:underline"
                  @click="tagsExpanded = !tagsExpanded"
                >
                  {{ tagsExpanded ? '收起' : `展开 (${existingTags.length - maxVisibleTags}+)` }}
                </button>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(tag, index) in editForm.tags"
                :key="index"
                class="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-body-sm rounded"
              >
                {{ tag }}
                <button type="button" class="text-mute hover:text-ink" @click="removeTag(index)">
                  x
                </button>
              </span>
            </div>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button class="btn-secondary flex-1" @click="close">取消</button>
          <button class="btn-primary flex-1" @click="save">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ArtworkItem } from '../stores/gallery'
import { useGalleryStore } from '../stores/gallery'

interface Props {
  visible: boolean
  artwork: ArtworkItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [data: { key: string; title: string; uploader: string; author: string; createdDate: string; tags: string[] }]
}>()

const galleryStore = useGalleryStore()

const editForm = ref({
  title: '',
  uploader: '',
  author: '',
  createdDate: '',
  tags: [] as string[]
})

const tagInput = ref('')
const tagsExpanded = ref(false)
const maxVisibleTags = 8

const showUploaderDropdown = ref(false)
const showAuthorDropdown = ref(false)
const uploaderDropdownRef = ref<HTMLElement>()
const authorDropdownRef = ref<HTMLElement>()

const existingTags = computed(() => {
  const allTags = galleryStore.artworks.flatMap((a) => a.tags || [])
  return [...new Set(allTags)].sort()
})

const displayedExistingTags = computed(() => {
  if (tagsExpanded.value) return existingTags.value
  return existingTags.value.slice(0, maxVisibleTags)
})

const existingUploaders = computed(() => {
  return [...new Set(galleryStore.artworks.map((a) => a.uploader).filter(Boolean))].sort()
})

const existingAuthors = computed(() => {
  return [...new Set(galleryStore.artworks.map((a) => a.author).filter(Boolean))].sort()
})

const filteredUploaders = computed(() => {
  const q = editForm.value.uploader.trim().toLowerCase()
  if (!q) return existingUploaders.value
  return existingUploaders.value.filter((u) => u.toLowerCase().includes(q))
})

const filteredAuthors = computed(() => {
  const q = editForm.value.author.trim().toLowerCase()
  if (!q) return existingAuthors.value
  return existingAuthors.value.filter((a) => a.toLowerCase().includes(q))
})

const selectUploader = (value: string) => {
  editForm.value.uploader = value
  showUploaderDropdown.value = false
}

const selectAuthor = (value: string) => {
  editForm.value.author = value
  showAuthorDropdown.value = false
}

const handleUploaderBlur = () => {
  setTimeout(() => { showUploaderDropdown.value = false }, 150)
}

const handleAuthorBlur = () => {
  setTimeout(() => { showAuthorDropdown.value = false }, 150)
}

watch(
  () => props.artwork,
  (artwork) => {
    if (artwork) {
      editForm.value = {
        title: artwork.title,
        uploader: artwork.uploader || '',
        author: artwork.author,
        createdDate: artwork.createdDate || '',
        tags: [...(artwork.tags || [])]
      }
    }
  }
)

const close = () => {
  emit('update:visible', false)
}

const handleBackdropClick = () => {
  close()
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !editForm.value.tags.includes(tag)) {
    editForm.value.tags.push(tag)
  }
  tagInput.value = ''
}

const removeTag = (index: number) => {
  editForm.value.tags.splice(index, 1)
}

const addExistingTag = (tag: string) => {
  if (!editForm.value.tags.includes(tag)) {
    editForm.value.tags.push(tag)
  }
}

const save = () => {
  if (!props.artwork) return
  emit('save', {
    key: props.artwork.key,
    title: editForm.value.title,
    uploader: editForm.value.uploader,
    author: editForm.value.author,
    createdDate: editForm.value.createdDate,
    tags: editForm.value.tags
  })
  close()
}
</script>

<style scoped>
.edit-dropdown-wrapper {
  position: relative;
}

.edit-dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 2px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  list-style: none;
  max-height: 180px;
  overflow-y: auto;
}

.edit-dropdown-item {
  padding: 8px 14px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: background 0.1s ease;
}

.edit-dropdown-item:hover {
  background: #f3f4f6;
}

.tag-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid #9ca3af;
  background: transparent;
  color: #6b7280;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.tag-btn:hover:not(:disabled) {
  border-color: #ffb366;
  color: #111827;
}
</style>
