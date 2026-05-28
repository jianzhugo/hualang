<template>
  <main class="upload-page">
    <div class="upload-sphere-bg">
      <SphereCarouselAsync
        :images="imageUrls"
        bg-color="#121212"
        :sphere-radius="30"
        :card-w="3.6"
        :card-h="2.5"
        :grid-gap="2.2"
        :depth-range="4"
        :auto-rotate-speed="0.0001"
        :sphere-spacing="120"
        :sphere-count="5"
        :drag-sensitivity="0.003"
        :drag-smoothing="0.3"
        :friction="0.95"
        :fade-in-duration="4"
        :cam-z="45.7"
        :init-rot-x="0.078"
        :fov="50"
        :facing-multiplier="0.5"
        :facing-offset="0.4"
        :overlay-opacity="0.4"
        :breath-min-speed="0.3"
        :breath-speed-range="0.3"
        :breath-min-amp="0.05"
        :breath-amp-range="0.08"
        :card-corner-radius="24"
        :max-rot-x="0.6"
        :vignette-radius="0"
        :vignette-softness="0.46"
        :vignette-intensity="1.0"
        :grain-intensity="0.13"
        :dist-fade-mult="1.3"
        :back-min-outside="0"
        :back-min-inside="0.55"
        :mouse-parallax="0"
      />
    </div>

    <div class="upload-sphere-overlay"></div>

    <!-- 密码验证 -->
    <div v-if="!uploadStore.isAuthenticated" class="upload-hero">
      <div class="upload-header">
        <h1 class="upload-title">稚 笔 生 花</h1>
        <p class="upload-subtitle">小小的手，画出大大的世界</p>
      </div>
      <div class="form-container">
        <div class="password-field">
          <input
            v-model="passwordInput"
            type="password"
            placeholder="输入密码后回车验证"
            class="password-field-input"
            @keyup.enter="handleVerify"
          />
          <button class="password-field-btn" :disabled="verifying" @click="handleVerify">
            <Lock :size="16" />
          </button>
        </div>
        <p v-if="passwordError" class="password-error">{{ passwordError }}</p>
      </div>
    </div>

    <!-- 上传界面 -->
    <div v-else class="upload-form-wrapper">
    <div class="upload-form-card">
      <!-- 上传者选择 -->
      <div class="mb-3">
        <label class="block text-body-sm font-semibold text-ink mb-1">上传者 *</label>
        <div class="dropdown-wrapper" ref="uploaderDropdownRef">
          <input
            v-model="uploadStore.selectedUploader"
            type="text"
            placeholder="选择或输入上传者"
            class="text-input"
            @focus="showUploaderDropdown = true"
            @input="showUploaderDropdown = true"
            @blur="handleUploaderBlur"
          />
          <ul v-if="showUploaderDropdown && filteredUploaders.length > 0" class="dropdown-list">
            <li
              v-for="uploader in filteredUploaders"
              :key="uploader"
              class="dropdown-item"
              @mousedown.prevent="selectUploader(uploader)"
            >
              {{ uploader }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 作者输入/选择 -->
      <div class="mb-3">
        <label class="block text-body-sm font-semibold text-ink mb-1">作品作者 *</label>
        <div class="dropdown-wrapper" ref="authorDropdownRef">
          <input
            v-model="uploadStore.selectedAuthor"
            type="text"
            placeholder="选择或输入新作者"
            class="text-input"
            @focus="showAuthorDropdown = true"
            @input="showAuthorDropdown = true"
            @blur="handleAuthorBlur"
          />
          <ul v-if="showAuthorDropdown && filteredAuthors.length > 0" class="dropdown-list">
            <li
              v-for="author in filteredAuthors"
              :key="author"
              class="dropdown-item"
              @mousedown.prevent="selectAuthor(author)"
            >
              {{ author }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 作品创作日期 -->
      <div class="mb-3">
        <label class="block text-body-sm font-semibold text-ink mb-1">创作日期</label>
        <input v-model="uploadStore.createdDate" type="date" class="text-input" />
      </div>

      <!-- 标签输入 -->
      <div class="mb-3">
        <label class="block text-body-sm font-semibold text-ink mb-1">标签</label>
        <div class="flex gap-2 mb-1">
          <input
            v-model="tagInput"
            type="text"
            placeholder="输入标签后按回车"
            class="text-input flex-1"
            @keyup.enter="addTag"
          />
          <button type="button" class="btn-secondary" @click="addTag">添加</button>
        </div>
        <div v-if="existingTags.length > 0" class="mb-1">
          <p class="text-caption-sm text-mute mb-1">已有标签（点击快速添加）：</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in displayedExistingTags"
              :key="tag"
              type="button"
              class="tag-btn"
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
      <div class="mb-3">
        <label class="block text-body-sm font-semibold text-ink mb-1">压缩图片</label>
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
        class="border-2 border-dashed border-hairline rounded-lg p-5 text-center transition-colors cursor-pointer mb-4"
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
        <div class="text-2xl mb-2">📁</div>
        <p class="text-body-sm text-ink font-medium mb-1">点击或拖拽图片到此处上传</p>
        <p class="text-caption-sm text-mute">支持 JPG、PNG、WebP 格式，最多同时上传 5 张</p>
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
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { X, Lock } from 'lucide-vue-next'
import { useUploadStore } from '../stores/upload'
import { useGalleryStore } from '../stores/gallery'
import { compressImage } from '../composables/useImageCompress'
const SphereCarouselAsync = defineAsyncComponent(() => import('../components/SphereCarousel.vue'))

const uploadStore = useUploadStore()
const galleryStore = useGalleryStore()
const passwordInput = ref('')
const passwordError = ref('')
const verifying = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const tagInput = ref('')
const tagsExpanded = ref(false)
const showUploaderDropdown = ref(false)
const showAuthorDropdown = ref(false)

const imageUrls = computed(() => {
  return galleryStore.artworks
    .filter(a => a.url)
    .map(a => a.url!)
})

const existingAuthors = computed(() => {
  const authors = [...new Set(galleryStore.artworks.map((a) => a.author))]
  return authors
})

const existingUploaders = computed(() => {
  const uploaders = [...new Set(galleryStore.artworks.map((a) => a.uploader))]
  return uploaders
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

const filteredUploaders = computed(() => {
  const q = uploadStore.selectedUploader.trim().toLowerCase()
  if (!q) return existingUploaders.value
  return existingUploaders.value.filter((u) => u.toLowerCase().includes(q))
})

const filteredAuthors = computed(() => {
  const q = uploadStore.selectedAuthor.trim().toLowerCase()
  if (!q) return existingAuthors.value
  return existingAuthors.value.filter((a) => a.toLowerCase().includes(q))
})

onMounted(() => {
  uploadStore.checkAuth()
  galleryStore.fetchGallery()
})

onUnmounted(() => {
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
  if (!uploadStore.selectedUploader && existingUploaders.value.length > 0) {
    uploadStore.selectedUploader = existingUploaders.value[0]
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

const selectUploader = (value: string) => {
  uploadStore.selectedUploader = value
  showUploaderDropdown.value = false
}

const selectAuthor = (value: string) => {
  uploadStore.selectedAuthor = value
  showAuthorDropdown.value = false
}

const handleUploaderBlur = () => {
  setTimeout(() => { showUploaderDropdown.value = false }, 150)
}

const handleAuthorBlur = () => {
  setTimeout(() => { showAuthorDropdown.value = false }, 150)
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

<style scoped>
.upload-page {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #121212;
}

.upload-sphere-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.upload-sphere-bg :deep(.sphere-carousel) {
  position: absolute;
  inset: 0;
}

.upload-sphere-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  /* 球体背景遮罩：调整透明度控制球体可见程度 */
  /* 0 = 完全透明(球体最清晰), 1 = 完全不透明(球体不可见) */
  background: radial-gradient(
    ellipse at center,
    rgba(18, 18, 18, 0.1) 0%,
    rgba(18, 18, 18, 0.4) 50%,
    rgba(18, 18, 18, 0.8) 100%
  );
}

.upload-hero {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 0 var(--spacing-lg);
  pointer-events: none;
}

.upload-hero .form-container {
  pointer-events: auto;
}

.upload-header {
  position: absolute;
  top: 25%;
  left: 0;
  right: 0;
  text-align: center;
  transform: translateY(-50%);
}

.upload-title {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, #ffb366, #66b3e6, #ffb366);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 4s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (min-width: 768px) {
  .upload-title {
    font-size: 48px;
  }
}

@media (min-width: 1024px) {
  .upload-title {
    font-size: 64px;
  }
}

.upload-subtitle {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: #adb7be;
}

@media (min-width: 768px) {
  .upload-subtitle {
    font-size: 20px;
  }
}

@media (min-width: 1024px) {
  .upload-subtitle {
    font-size: 24px;
  }
}

.upload-form-card {
  position: relative;
  width: 100%;
  max-width: 500px;
  padding: 24px;
  border-radius: 12px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.upload-form-card::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 14px;
  padding: 3px;
  background: linear-gradient(
    135deg,
    #ffb366,
    #66b3e6,
    #ffb366,
    #66b3e6
  );
  background-size: 200% 200%;
  animation: gradientFlow 3s ease infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  z-index: -1;
}

@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes marquee-border {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 300% 50%;
  }
}

.upload-form-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: 80px var(--spacing-lg) 48px;
  overflow-y: auto;
  pointer-events: none;
}

.upload-form-wrapper .upload-form-card {
  pointer-events: auto;
}

.dropdown-wrapper {
  position: relative;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 2px;
  padding: 4px 0;
  background: var(--color-surface-card);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  list-style: none;
  max-height: 180px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 8px 14px;
  font-size: 14px;
  color: var(--color-ink);
  cursor: pointer;
  transition: background 0.1s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.upload-form-card :deep(.text-input) {
  background: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  transition: border-color 0.15s ease;
}

.upload-form-card :deep(.text-input:focus) {
  border-color: #ffb366 !important;
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 179, 102, 0.3) !important;
}

.upload-form-card :deep(.border-hairline) {
  border-color: rgba(255, 255, 255, 0.2) !important;
  transition: border-color 0.15s ease;
}

.upload-form-card :deep(.border-dashed.border-hairline) {
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.upload-form-card :deep(.btn-secondary) {
  background: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  transition: border-color 0.15s ease;
}

.upload-form-card :deep(.btn-secondary:hover) {
  border-color: #ffb366 !important;
}

.tag-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: var(--color-mute);
  transition: border-color 0.15s ease, color 0.15s ease;
}

.tag-btn:hover:not(:disabled) {
  border-color: #ffb366;
  color: var(--color-ink);
}
</style>
