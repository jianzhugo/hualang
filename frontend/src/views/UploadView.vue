<template>
  <main class="page-container py-8">
    <h1
      class="text-heading-xl font-bold tracking-tight text-ink mb-2"
      style="letter-spacing: -1.2px;"
    >
      上传画作
    </h1>
    <p class="text-body-md text-mute mb-8">将孩子的画作安全上传到画廊</p>

    <!-- 密码验证 -->
    <div v-if="!uploadStore.isAuthenticated" class="form-container">
      <div class="feature-card-soft">
        <h2 class="text-heading-lg font-semibold text-ink mb-4">请输入上传密码</h2>
        <div class="space-y-4">
          <input
            v-model="passwordInput"
            type="password"
            placeholder="输入密码"
            class="text-input"
            @keyup.enter="handleVerify"
          />
          <p v-if="passwordError" class="text-error text-sm">{{ passwordError }}</p>
          <button class="btn-primary w-full" :disabled="verifying" @click="handleVerify">
            {{ verifying ? '验证中...' : '验证' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 上传界面 -->
    <div v-else class="form-container">
      <!-- 上传者选择 -->
      <div class="mb-6">
        <label class="block text-body-sm font-semibold text-ink mb-2">上传者 *</label>
        <input
          v-model="uploadStore.selectedUploader"
          list="uploader-list"
          type="text"
          placeholder="选择或输入上传者"
          class="text-input"
        />
        <datalist id="uploader-list">
          <option value="爸爸" />
          <option value="妈妈" />
          <option value="爷爷" />
          <option value="奶奶" />
        </datalist>
      </div>

      <!-- 作者输入/选择 -->
      <div class="mb-6">
        <label class="block text-body-sm font-semibold text-ink mb-2">作品作者 *</label>
        <input
          v-model="uploadStore.selectedAuthor"
          list="author-list"
          type="text"
          placeholder="选择或输入新作者"
          class="text-input"
        />
        <datalist id="author-list">
          <option v-for="author in existingAuthors" :key="author" :value="author" />
        </datalist>
      </div>

      <!-- 作品创作日期 -->
      <div class="mb-6">
        <label class="block text-body-sm font-semibold text-ink mb-2">创作日期</label>
        <input v-model="uploadStore.createdDate" type="date" class="text-input" />
      </div>

      <!-- 标签输入 -->
      <div class="mb-6">
        <label class="block text-body-sm font-semibold text-ink mb-2">标签</label>
        <div class="flex gap-2 mb-2">
          <input
            v-model="tagInput"
            type="text"
            placeholder="输入标签后按回车"
            class="text-input flex-1"
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
              class="px-2 py-0.5 text-caption-sm rounded border border-hairline text-mute hover:text-ink hover:border-primary transition-colors"
              :class="{ 'opacity-40': uploadStore.selectedTags.includes(tag) }"
              :disabled="uploadStore.selectedTags.includes(tag)"
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
            v-for="(tag, index) in uploadStore.selectedTags"
            :key="index"
            class="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-body-sm rounded"
          >
            {{ tag }}
            <button type="button" class="text-mute hover:text-ink" @click="removeTag(index)">
              ×
            </button>
          </span>
        </div>
      </div>

      <!-- 压缩选项 -->
      <div class="mb-6">
        <label class="block text-body-sm font-semibold text-ink mb-2">压缩图片</label>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-4 py-1.5 text-body-sm rounded border transition-colors"
            :class="uploadStore.compressImages
              ? 'bg-primary text-white border-primary'
              : 'border-hairline text-mute hover:border-primary'"
            @click="uploadStore.compressImages = true"
          >
            是
          </button>
          <button
            type="button"
            class="px-4 py-1.5 text-body-sm rounded border transition-colors"
            :class="!uploadStore.compressImages
              ? 'bg-primary text-white border-primary'
              : 'border-hairline text-mute hover:border-primary'"
            @click="uploadStore.compressImages = false"
          >
            否
          </button>
        </div>
        <p class="text-caption-sm text-mute mt-1">
          是：按文件大小自动调整质量转为WebP格式；否：仅转换格式保持原分辨率
        </p>
      </div>

      <!-- 拖拽上传区 -->
      <div
        class="border-2 border-dashed border-hairline rounded-lg p-8 text-center transition-colors cursor-pointer mb-6"
        :class="{ 'border-primary bg-primary/5': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />
        <div class="text-4xl mb-3">📁</div>
        <p class="text-body-md text-ink font-medium mb-1">点击或拖拽图片到此处上传</p>
        <p class="text-body-sm text-mute">支持 JPG、PNG、WebP 格式，最多同时上传 3 张</p>
      </div>

      <!-- 上传队列 -->
      <div v-if="uploadStore.uploadQueue.length > 0" class="space-y-3">
        <h3 class="text-heading-md font-semibold text-ink">上传队列</h3>
        <div
          v-for="item in uploadStore.uploadQueue"
          :key="item.id"
          class="feature-card-soft flex items-center gap-4"
        >
          <div class="flex-1 min-w-0">
            <input
              v-model="item.displayName"
              type="text"
              class="text-input text-body-sm font-medium"
              :title="item.file.name"
              @click.stop
            />
            <p class="text-caption-sm text-mute mt-1">
              {{ formatStatus(item.status) }}
              <span v-if="item.errorMessage" class="text-error"> - {{ item.errorMessage }}</span>
            </p>
            <div class="mt-2 h-1.5 bg-hairline-soft rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all duration-300"
                :style="{ width: `${item.progress}%` }"
              ></div>
            </div>
          </div>
          <button
            v-if="item.status === 'error'"
            class="btn-secondary text-xs h-8 px-3"
            @click="retryItem(item.id)"
          >
            重试
          </button>
          <button
            class="btn-icon-circular shrink-0"
            @click="uploadStore.removeItem(item.id)"
            aria-label="移除"
          >
            <X :size="16" />
          </button>
        </div>

        <button
          v-if="!uploadStore.isUploading && hasPendingItems"
          class="btn-primary w-full mt-4"
          :disabled="!uploadStore.selectedUploader || !uploadStore.selectedAuthor"
          @click="startUpload"
        >
          开始上传
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useUploadStore } from '../stores/upload'
import { useGalleryStore } from '../stores/gallery'
import { compressImage } from '../composables/useImageCompress'

const uploadStore = useUploadStore()
const galleryStore = useGalleryStore()
const passwordInput = ref('')
const passwordError = ref('')
const verifying = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const tagInput = ref('')
const tagsExpanded = ref(false)

const existingAuthors = computed(() => {
  const authors = [...new Set(galleryStore.artworks.map((a) => a.author))]
  return authors
})

const hasPendingItems = computed(() =>
  uploadStore.uploadQueue.some((item) => item.status === 'pending' || item.status === 'error')
)

const maxVisibleTags = 8

const existingTags = computed(() => {
  const allTags = galleryStore.artworks.flatMap((a) => a.tags || [])
  return [...new Set(allTags)].sort()
})

const displayedExistingTags = computed(() => {
  if (tagsExpanded.value) return existingTags.value
  return existingTags.value.slice(0, maxVisibleTags)
})

onMounted(() => {
  uploadStore.checkAuth()
  galleryStore.fetchGallery()
})

const handleVerify = async () => {
  if (!passwordInput.value) return
  verifying.value = true
  passwordError.value = ''
  const ok = await uploadStore.verifyPassword(passwordInput.value)
  if (!ok) {
    passwordError.value = '密码不正确'
  }
  verifying.value = false
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) {
    addFiles(Array.from(input.files))
  }
  input.value = ''
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    addFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')))
  }
}

const addFiles = (files: File[]) => {
  if (!uploadStore.selectedUploader) {
    uploadStore.selectedUploader = '爸爸'
  }
  if (!uploadStore.selectedAuthor && existingAuthors.value.length > 0) {
    uploadStore.selectedAuthor = existingAuthors.value[0]
  }
  uploadStore.addFiles(files, uploadStore.selectedUploader)
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !uploadStore.selectedTags.includes(tag)) {
    uploadStore.selectedTags.push(tag)
  }
  tagInput.value = ''
}

const removeTag = (index: number) => {
  uploadStore.selectedTags.splice(index, 1)
}

const addExistingTag = (tag: string) => {
  if (!uploadStore.selectedTags.includes(tag)) {
    uploadStore.selectedTags.push(tag)
  }
}

const startUpload = async () => {
  if (!uploadStore.selectedUploader || !uploadStore.selectedAuthor) {
    alert('请填写上传者和作品作者')
    return
  }
  for (const item of uploadStore.uploadQueue) {
    if (item.status === 'pending' || item.status === 'error') {
      uploadStore.updateItem(item.id, { status: 'compressing', progress: 0 })
      try {
        const compressed = await compressImage(item.file, { enableCompression: uploadStore.compressImages })
        uploadStore.updateItem(item.id, {
          compressedBlob: compressed,
          status: 'pending',
          progress: 0
        })
      } catch {
        uploadStore.updateItem(item.id, { status: 'pending', progress: 0 })
      }
    }
  }
  await uploadStore.processQueue()
  await galleryStore.fetchGallery()
}

const retryItem = (id: string) => {
  uploadStore.updateItem(id, { status: 'pending', progress: 0, errorMessage: undefined })
  startUpload()
}

const formatStatus = (status: string): string => {
  const map: Record<string, string> = {
    pending: '等待中',
    compressing: uploadStore.compressImages ? '压缩中' : '转换格式中',
    uploading: '上传中',
    registering: '登记中',
    done: '已完成',
    error: '上传失败'
  }
  return map[status] || status
}

</script>
