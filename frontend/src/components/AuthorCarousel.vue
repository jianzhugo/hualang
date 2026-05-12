<template>
  <div class="carousel-container">
    <div class="carousel-header">
      <h3 class="carousel-author-name">{{ authorName }}</h3>
      <p class="carousel-author-pinyin">{{ authorPinyin }}</p>
    </div>
    <div
      class="carousel-wrapper"
      ref="carouselRef"
      @mousedown="onDragStart"
      @mousemove="onDragMove"
      @mouseup="onDragEnd"
      @mouseleave="onDragEnd"
      @touchstart="onDragStart"
      @touchmove="onDragMove"
      @touchend="onDragEnd"
    >
      <div
        class="carousel-track"
        ref="trackRef"
        :style="trackStyle"
      >
        <div
          v-for="(item, index) in loopItems"
          :key="`${item.key}-${index}`"
          class="carousel-slide"
          :style="getSlideStyle(index)"
        >
          <img
            :src="item.url"
            :alt="item.title"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { ArtworkItem } from '../stores/gallery'

interface Props {
  authorName: string
  authorPinyin: string
  artworks: ArtworkItem[]
}

const props = defineProps<Props>()

const carouselRef = ref<HTMLElement>()
const trackRef = ref<HTMLElement>()
const isDragging = ref(false)
const startPos = ref(0)
const dragTranslate = ref(0)
const isPlaying = ref(true)
const containerWidth = ref(0)
const resetLock = ref(false)
const jumping = ref(false)

const AUTOPLAY_INTERVAL = 3000
const VISIBLE_COUNT = 5
const COPY_TIMES = 3

const loopItems = computed(() => {
  if (props.artworks.length === 0) return []
  const result: ArtworkItem[] = []
  for (let i = 0; i < COPY_TIMES; i++) {
    result.push(...props.artworks)
  }
  return result
})

const cardWidth = computed(() => {
  if (containerWidth.value === 0) return 200
  return containerWidth.value / VISIBLE_COUNT
})

const cardGap = computed(() => 16)
const step = computed(() => cardWidth.value + cardGap.value)
const setCount = computed(() => props.artworks.length)
const totalItems = computed(() => loopItems.value.length)

const position = ref(setCount.value)
const focusIndex = computed(() => {
  const total = totalItems.value
  if (total === 0) return 0
  return ((position.value % total) + total) % total
})

const trackStyle = computed(() => {
  const offset = -(focusIndex.value * step.value)
  const center = (containerWidth.value / 2) - (cardWidth.value / 2)
  const tx = center + offset + dragTranslate.value
  return {
    transform: `translateX(${tx}px)`,
    transition: resetLock.value ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)'
  }
})

function getSlideStyle(index: number) {
  const distance = Math.abs(index - focusIndex.value)
  const scale = distance === 0 ? 1.08 : Math.max(0.55, 1 - distance * 0.14)
  const opacity = distance === 0 ? 1 : Math.max(0.3, 1 - distance * 0.18)
  const zIndex = Math.max(1, 20 - distance)
  return {
    transform: `scale(${scale})`,
    opacity,
    zIndex,
    width: `${cardWidth.value}px`
  }
}

function applyStyles() {
  const slides = trackRef.value?.querySelectorAll('.carousel-slide')
  slides?.forEach((slide, index) => {
    const distance = Math.abs(index - focusIndex.value)
    const scale = distance === 0 ? 1.08 : Math.max(0.55, 1 - distance * 0.14)
    const opacity = distance === 0 ? 1 : Math.max(0.3, 1 - distance * 0.18)
    const zIndex = Math.max(1, 20 - distance)
    const el = slide as HTMLElement
    el.style.transform = `scale(${scale})`
    el.style.opacity = opacity.toString()
    el.style.zIndex = zIndex.toString()
  })
}

// 执行静默跳回：先锁住过渡，再改 position，再解锁
function silentJumpBack() {
  jumping.value = true
  resetLock.value = true
  nextTick(() => {
    position.value -= setCount.value
    applyStyles()
    nextTick(() => {
      resetLock.value = false
      jumping.value = false
    })
  })
}

function moveNext() {
  position.value++
  applyStyles()

  // 检查是否进入第3套数据
  if (focusIndex.value >= setCount.value * 2) {
    // 等当前的过渡动画播完（0.5s），再静默跳回
    setTimeout(() => silentJumpBack(), 500)
  }
}

function movePrev() {
  if (position.value > 0) {
    position.value--
    applyStyles()
  }
}

function snapToNearest() {
  const stepPx = step.value
  const snappedOffset = Math.round(-dragTranslate.value / stepPx)
  dragTranslate.value = 0
  position.value = position.value + snappedOffset
  applyStyles()
}

let autoplayTimer: ReturnType<typeof setInterval> | null = null

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    if (isPlaying.value && !isDragging.value && !jumping.value) {
      moveNext()
    }
  }, AUTOPLAY_INTERVAL)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientX
  return (e as MouseEvent).clientX
}

function onDragStart(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  startPos.value = getClientX(e)
  dragTranslate.value = 0
  if (carouselRef.value) carouselRef.value.style.cursor = 'grabbing'
  stopAutoplay()
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  const currentX = getClientX(e)
  dragTranslate.value = currentX - startPos.value

  const stepPx = step.value
  const virtualFocus = focusIndex.value - (dragTranslate.value / stepPx)

  const slides = trackRef.value?.querySelectorAll('.carousel-slide')
  slides?.forEach((slide, index) => {
    const distance = Math.abs(index - virtualFocus)
    const scale = distance === 0 ? 1.08 : Math.max(0.55, 1 - distance * 0.14)
    const opacity = distance === 0 ? 1 : Math.max(0.3, 1 - distance * 0.18)
    const el = slide as HTMLElement
    el.style.transform = `scale(${scale})`
    el.style.opacity = opacity.toString()
  })
}

function onDragEnd(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  if (carouselRef.value) carouselRef.value.style.cursor = 'grab'
  snapToNearest()
  if (isPlaying.value) startAutoplay()
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (carouselRef.value) {
    carouselRef.value.style.cursor = 'grab'
    const updateWidth = () => {
      if (carouselRef.value) containerWidth.value = carouselRef.value.clientWidth
    }
    updateWidth()
    resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(carouselRef.value)
  }
  position.value = setCount.value
  applyStyles()
  startAutoplay()
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  stopAutoplay()
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

.carousel-wrapper {
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  padding: 40px 0;
}

.carousel-wrapper:active {
  cursor: grabbing;
}

.carousel-track {
  display: flex;
  gap: 16px;
  align-items: center;
  will-change: transform;
}

.carousel-slide {
  flex-shrink: 0;
  transition: transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1),
              opacity 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
  will-change: transform, opacity;
  transform-origin: center center;
}

.carousel-slide img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  pointer-events: none;
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
  .carousel-wrapper {
    padding: 24px 0;
  }
}
</style>