<template>
  <div class="carousel-container" v-if="artworks.length > 0">
    <div class="carousel-header">
      <h3 class="carousel-author-name">{{ authorName }}</h3>
      <p class="carousel-author-pinyin">{{ authorPinyin }}</p>
    </div>

    <div v-if="artworks.length < 3" class="static-row">
      <div
        v-for="item in artworks"
        :key="item.key"
        class="static-item"
      >
        <img :src="item.url" :alt="item.title" loading="lazy" />
      </div>
    </div>

    <div
      v-else
      class="carousel-viewport"
      ref="viewportRef"
      @mousedown="onPointerDown"
      @mousemove="onPointerMove"
      @mouseup="onPointerUp"
      @mouseleave="onPointerUp"
      @touchstart.prevent="onPointerDown"
      @touchmove.prevent="onPointerMove"
      @touchend="onPointerUp"
    >
      <div class="carousel-stage">
        <div
          v-for="(item, idx) in artworks"
          :key="item.key"
          class="carousel-card"
          :style="getSlideStyle(idx)"
        >
          <img :src="item.url" :alt="item.title" loading="lazy" draggable="false" />
        </div>
      </div>
    </div>

    <div class="carousel-dots" v-if="artworks.length >= 3">
      <button
        v-for="(_, i) in artworks.length"
        :key="i"
        class="carousel-dot"
        :class="{ active: i === activeIndex % artworks.length }"
        :aria-label="`第 ${i + 1} 张`"
        @click="goTo(i)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { ArtworkItem } from '../stores/gallery'

interface Props {
  authorName: string
  authorPinyin: string
  artworks: ArtworkItem[]
}
const props = defineProps<Props>()

const viewportRef = ref<HTMLElement>()
const containerWidth = ref(0)

const isMobile = computed(() => containerWidth.value > 0 && containerWidth.value < 768)

const cardWidthPx = computed(() => {
  if (isMobile.value) {
    return Math.min(containerWidth.value * 0.55, 280)
  }
  return Math.min(containerWidth.value * 0.2, 340)
})

const offsetNearPx = computed(() => {
  const cw = cardWidthPx.value
  return cw * 0.65
})

const offsetFarPx = computed(() => {
  const cw = cardWidthPx.value
  return cw * 1.2
})

const total = computed(() => props.artworks.length)
const activeIndex = ref(0)

function normalizeIndex(idx: number): number {
  const n = total.value
  if (n === 0) return 0
  return ((idx % n) + n) % n
}

function getSlideStyle(index: number): Record<string, string> {
  const n = total.value
  if (n === 0) return { display: 'none' }

  let diff = index - activeIndex.value
  if (diff > n / 2) diff -= n
  if (diff < -n / 2) diff += n

  const absDiff = Math.abs(diff)

  if (absDiff > 2) {
    const side = diff > 0 ? 1 : -1
    return {
      opacity: '0',
      transform: `translateX(${side * offsetFarPx.value}px) scale(0.65)`,
      pointerEvents: 'none',
      zIndex: '0',
      visibility: 'hidden',
    }
  }

  let translateX: number
  let scale: number
  let opacity: number

  if (absDiff === 0) {
    translateX = 0
    scale = 1
    opacity = 1
  } else if (absDiff === 1) {
    translateX = diff > 0 ? offsetNearPx.value : -offsetNearPx.value
    scale = 0.8
    opacity = 0.85
  } else {
    translateX = diff > 0 ? offsetFarPx.value : -offsetFarPx.value
    scale = 0.7
    opacity = 0.6
  }

  return {
    opacity: String(opacity),
    transform: `translateX(${translateX}px) scale(${scale})`,
    zIndex: String(10 - absDiff),
    pointerEvents: absDiff === 0 ? 'auto' : 'none',
    visibility: 'visible',
  }
}

// ---- 自动播放 ----
const AUTOPLAY_MS = 3000
let autoplayTimer: ReturnType<typeof setTimeout> | null = null
let isPlaying = ref(true)

function scheduleNext() {
  clearAutoplay()
  if (!isPlaying.value) return
  autoplayTimer = setTimeout(() => {
    activeIndex.value = normalizeIndex(activeIndex.value + 1)
    scheduleNext()
  }, AUTOPLAY_MS)
}

function clearAutoplay() {
  if (autoplayTimer) {
    clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
}

function goTo(idx: number) {
  activeIndex.value = normalizeIndex(idx)
  if (isPlaying.value) {
    scheduleNext()
  }
}

// ---- 拖拽 ----
const isDragging = ref(false)
let dragStartX = 0
let dragStartIndex = 0
let dragDelta = 0
let hasMoved = false

function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientX
  return (e as MouseEvent).clientX
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  hasMoved = false
  dragStartX = getClientX(e)
  dragStartIndex = activeIndex.value
  dragDelta = 0
  clearAutoplay()
  if (viewportRef.value) viewportRef.value.style.cursor = 'grabbing'
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  const x = getClientX(e)
  dragDelta = x - dragStartX
  if (Math.abs(dragDelta) > 5) hasMoved = true
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  if (viewportRef.value) viewportRef.value.style.cursor = 'grab'

  if (hasMoved) {
    const threshold = cardWidthPx.value * 0.2
    if (dragDelta < -threshold) {
      activeIndex.value = normalizeIndex(activeIndex.value + 1)
    } else if (dragDelta > threshold) {
      activeIndex.value = normalizeIndex(activeIndex.value - 1)
    }
  }

  dragDelta = 0
  hasMoved = false
  isPlaying.value = true
  scheduleNext()
}

// ---- 生命周期 ----
let resizeObserver: ResizeObserver | null = null
let carouselReady = false

function setupCarousel() {
  if (carouselReady) return
  if (!viewportRef.value || props.artworks.length < 3) return

  carouselReady = true

  viewportRef.value.style.cursor = 'grab'

  const measure = () => {
    if (viewportRef.value) {
      containerWidth.value = viewportRef.value.clientWidth
    }
  }
  measure()

  resizeObserver = new ResizeObserver(() => {
    measure()
  })
  resizeObserver.observe(viewportRef.value)

  scheduleNext()
}

function teardownCarousel() {
  resizeObserver?.disconnect()
  resizeObserver = null
  clearAutoplay()
  carouselReady = false
}

onMounted(() => {
  nextTick(() => {
    setupCarousel()
  })
})

watch(() => props.artworks.length, () => {
  nextTick(() => {
    setupCarousel()
  })
})

onBeforeUnmount(() => {
  teardownCarousel()
})
</script>

<style scoped>
.carousel-container {
  margin-bottom: 64px;
}
.carousel-container:last-child {
  margin-bottom: 0;
}

.carousel-header {
  text-align: center;
  margin-bottom: 32px;
}
.carousel-author-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}
.carousel-author-pinyin {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-ash);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.static-row {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 8px 0;
}
.static-item {
  flex-shrink: 0;
  width: clamp(160px, 30vw, 280px);
}
.static-item img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.carousel-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  padding: 40px 0;
  touch-action: pan-y;
}

.carousel-stage {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(280px, 42vh, 520px);
}

.carousel-card {
  position: absolute;
  width: clamp(200px, 22vw, 340px);
  transition: all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
  will-change: transform, opacity;
  transform-origin: center center;
}

.carousel-card img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  pointer-events: none;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}
.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: #d1d5db;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease;
}
.carousel-dot.active {
  background: var(--color-ink, #111827);
  transform: scale(1.4);
}
.carousel-dot:hover {
  background: #9ca3af;
}
.carousel-dot.active:hover {
  background: var(--color-ink, #111827);
}

@media (max-width: 768px) {
  .carousel-container {
    margin-bottom: 40px;
  }
  .carousel-header {
    margin-bottom: 20px;
  }
  .carousel-author-name {
    font-size: 18px;
  }
  .carousel-viewport {
    padding: 24px 0;
  }
  .carousel-dots {
    margin-top: 16px;
  }
}
</style>
