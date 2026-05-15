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
      @mouseleave="onPointerCancel"
      @touchstart.prevent="onPointerDown"
      @touchmove.prevent="onPointerMove"
      @touchend="onPointerUp"
    >
      <div class="carousel-stage" :style="stageStyle">
        <div
          v-for="(item, idx) in artworks"
          :key="item.key"
          class="carousel-card"
          :class="{ 'carousel-card-dragging': isDragging }"
          :style="{ width: cardWidthPx + 'px', ...getSlideStyle(idx) }"
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
        :class="{ active: i === currentDotIndex }"
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

const visibleCount = computed(() => isMobile.value ? 3 : 5)

const cardWidthPx = computed(() => {
  const w = containerWidth.value
  if (w <= 0) return 200

  if (isMobile.value) {
    return w * 0.52
  }

  const count = visibleCount.value
  const gapRatio = 0.025
  const totalGapRatio = gapRatio * (count - 1)
  const cardRatio = (1 - totalGapRatio) / count
  return w * cardRatio
})

const gapPx = computed(() => {
  const w = containerWidth.value
  if (w <= 0) return 16
  if (isMobile.value) {
    return w * 0.02
  }
  return w * 0.025
})

const stepPx = computed(() => cardWidthPx.value + gapPx.value)

const mobileNearOffset = computed(() => {
  const cw = cardWidthPx.value
  return cw * 0.55
})

const mobileFarOffset = computed(() => {
  const cw = cardWidthPx.value
  return cw * 1.0
})

const stageStyle = computed(() => ({
  height: `clamp(280px, 42vh, 520px)`,
}))

const total = computed(() => props.artworks.length)
const activeIndex = ref(0)
const dragFraction = ref(0)

const visualIndex = computed(() => activeIndex.value + dragFraction.value)

const currentDotIndex = computed(() => {
  const n = total.value
  if (n === 0) return 0
  return ((Math.round(visualIndex.value) % n) + n) % n
})

function normalizeIndex(idx: number): number {
  const n = total.value
  if (n === 0) return 0
  return ((idx % n) + n) % n
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function getSlideStyle(index: number): Record<string, string> {
  const n = total.value
  if (n === 0) return { display: 'none' }

  let diff = index - visualIndex.value
  if (diff > n / 2) diff -= n
  if (diff < -n / 2) diff += n

  const absDiff = Math.abs(diff)
  const halfVisible = visibleCount.value / 2

  if (absDiff > halfVisible + 0.5) {
    const side = diff > 0 ? 1 : -1
    return {
      opacity: '0',
      transform: `translateX(${side * (halfVisible * stepPx.value)}px) scale(0.6)`,
      pointerEvents: 'none',
      zIndex: '0',
      visibility: 'hidden',
    }
  }

  const step = stepPx.value
  const cw = cardWidthPx.value

  let translateX: number
  let scale: number
  let opacity: number

  if (isMobile.value) {
    const near = mobileNearOffset.value
    const far = mobileFarOffset.value

    if (absDiff <= 0.5) {
      const t = absDiff / 0.5
      translateX = diff > 0 ? lerp(0, near, t) : lerp(0, -near, t)
      scale = lerp(1, 0.78, t)
      opacity = lerp(1, 0.85, t)
    } else if (absDiff <= 1.5) {
      const t = (absDiff - 0.5) / 1
      const fromX = diff > 0 ? near : -near
      const toX = diff > 0 ? far : -far
      translateX = lerp(fromX, toX, t)
      scale = lerp(0.78, 0.6, t)
      opacity = lerp(0.85, 0.5, t)
    } else {
      const t = Math.min((absDiff - 1.5) / 1, 1)
      const fromX = diff > 0 ? far : -far
      const toX = diff > 0 ? far * 1.3 : -far * 1.3
      translateX = lerp(fromX, toX, t)
      scale = lerp(0.6, 0.5, t)
      opacity = lerp(0.5, 0.2, t)
    }
  } else {
    translateX = diff * step
    const maxDist = halfVisible
    const distRatio = Math.min(absDiff / maxDist, 1)
    scale = lerp(1, 0.7, distRatio)
    opacity = lerp(1, 0.5, distRatio)
  }

  const z = Math.max(1, Math.round(10 - absDiff * 3))

  return {
    opacity: String(opacity),
    transform: `translateX(${translateX}px) scale(${scale})`,
    zIndex: String(z),
    pointerEvents: absDiff < 0.5 ? 'auto' : 'none',
    visibility: 'visible',
  }
}

// ---- 自动播放 ----
const AUTOPLAY_MS = 3000
let autoplayTimer: ReturnType<typeof setTimeout> | null = null
const isPlaying = ref(true)

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
let dragDelta = 0
let hasMoved = false
let rafId = 0

function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientX
  return (e as MouseEvent).clientX
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  hasMoved = false
  dragStartX = getClientX(e)
  dragDelta = 0
  dragFraction.value = 0
  clearAutoplay()
  if (viewportRef.value) viewportRef.value.style.cursor = 'grabbing'
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  const x = getClientX(e)
  dragDelta = x - dragStartX
  if (Math.abs(dragDelta) > 5) hasMoved = true

  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    const pxPerSlide = isMobile.value ? mobileNearOffset.value : stepPx.value
    dragFraction.value = -dragDelta / pxPerSlide
  })
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  cancelAnimationFrame(rafId)
  if (viewportRef.value) viewportRef.value.style.cursor = 'grab'

  if (hasMoved) {
    const rounded = Math.round(visualIndex.value)
    const n = total.value
    activeIndex.value = ((rounded % n) + n) % n
  }

  dragFraction.value = 0
  dragDelta = 0
  hasMoved = false
  isPlaying.value = true
  scheduleNext()
}

function onPointerCancel() {
  if (!isDragging.value) return
  isDragging.value = false
  cancelAnimationFrame(rafId)
  if (viewportRef.value) viewportRef.value.style.cursor = 'grab'
  dragFraction.value = 0
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
  cancelAnimationFrame(rafId)
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
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
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
}

.carousel-card {
  position: absolute;
  transition: transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1),
              opacity 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
  will-change: transform, opacity;
  transform-origin: center center;
}

.carousel-card-dragging {
  transition: none;
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
