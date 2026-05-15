<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click="handleBackdropClick"
    >
      <!-- Scrim -->
      <div class="absolute inset-0 bg-black/70"></div>

      <!-- 关闭按钮 -->
      <button
        class="btn-icon-circular absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20"
        @click="close"
        aria-label="关闭"
      >
        <X :size="20" />
      </button>

      <!-- 编辑按钮 -->
      <button
        class="btn-icon-circular absolute top-4 right-16 z-10 bg-white/10 hover:bg-white/20"
        @click.stop="$emit('edit', currentArtwork)"
        aria-label="编辑"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
      </button>

      <!-- 左箭头 -->
      <button
        v-if="hasPrev"
        class="btn-icon-circular absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20"
        @click.stop="prev"
        aria-label="上一张"
      >
        <ChevronLeft :size="24" />
      </button>

      <!-- 右箭头 -->
      <button
        v-if="hasNext"
        class="btn-icon-circular absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20"
        @click.stop="next"
        aria-label="下一张"
      >
        <ChevronRight :size="24" />
      </button>

      <!-- 图片容器 -->
      <div
        class="relative z-10 max-w-[90vw] max-h-[80vh] flex flex-col items-center"
        @click.stop
      >
        <img
          :src="currentArtwork?.url || ''"
          :alt="currentArtwork?.title"
          class="max-w-full max-h-[70vh] object-contain rounded-lg"
          @wheel.prevent="handleWheel"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
          ref="imageRef"
        />

        <!-- 信息栏 -->
        <div class="mt-4 text-center text-white">
          <p class="text-lg font-semibold">{{ currentArtwork?.title }}</p>
          <p class="text-sm text-white/70">
            {{ currentArtwork?.author }} · {{ currentArtwork?.createdDate || currentArtwork?.date }}
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { ArtworkItem } from '../stores/gallery'

interface Props {
  visible: boolean
  artworks: ArtworkItem[]
  currentIndex: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:currentIndex': [value: number]
  edit: [artwork: ArtworkItem]
}>()

const imageRef = ref<HTMLImageElement>()
const scale = ref(1)
const touchStartX = ref(0)

const currentArtwork = computed(() => props.artworks[props.currentIndex] || null)
const hasPrev = computed(() => props.currentIndex > 0)
const hasNext = computed(() => props.currentIndex < props.artworks.length - 1)

const close = () => {
  scale.value = 1
  emit('update:visible', false)
}

const prev = () => {
  if (hasPrev.value) {
    scale.value = 1
    emit('update:currentIndex', props.currentIndex - 1)
  }
}

const next = () => {
  if (hasNext.value) {
    scale.value = 1
    emit('update:currentIndex', props.currentIndex + 1)
  }
}

const handleBackdropClick = () => close()

const handleWheel = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.max(0.5, Math.min(3, scale.value + delta))
  if (imageRef.value) {
    imageRef.value.style.transform = `scale(${scale.value})`
  }
}

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e: TouchEvent) => {
  const diff = touchStartX.value - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0 && hasNext.value) next()
    else if (diff < 0 && hasPrev.value) prev()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!props.visible) return
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
    }
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
img {
  touch-action: pan-y;
  transition: transform 0.1s ease;
}
</style>
