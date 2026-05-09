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

          <div>
            <label class="block text-body-sm font-semibold text-ink mb-2">作品作者</label>
            <input v-model="editForm.author" type="text" class="text-input" />
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
import { ref, watch } from 'vue'
import type { ArtworkItem } from '../stores/gallery'

interface Props {
  visible: boolean
  artwork: ArtworkItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [data: { key: string; title: string; author: string; createdDate: string; tags: string[] }]
}>()

const editForm = ref({
  title: '',
  author: '',
  createdDate: '',
  tags: [] as string[]
})

const tagInput = ref('')

watch(
  () => props.artwork,
  (artwork) => {
    if (artwork) {
      editForm.value = {
        title: artwork.title,
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

const save = () => {
  if (!props.artwork) return
  emit('save', {
    key: props.artwork.key,
    title: editForm.value.title,
    author: editForm.value.author,
    createdDate: editForm.value.createdDate,
    tags: editForm.value.tags
  })
  close()
}
</script>
