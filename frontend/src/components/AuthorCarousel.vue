<template>
  <div class="carousel-container" v-if="artworks.length > 0">
    <div class="carousel-header">
      <h3 class="carousel-author-name">{{ authorName }}</h3>
      <p class="carousel-author-pinyin">{{ authorPinyin }}</p>
    </div>

    <!-- 作品不足 3 张：静态展示 -->
    <div v-if="artworks.length < 3" class="static-row">
      <div
        v-for="item in artworks"
        :key="item.key"
        class="static-item"
        :style="{ width: cardWidth + 'px' }"
      >
        <img :src="item.url" :alt="item.title" loading="lazy" />
      </div>
    </div>

    <!-- 作品 >= 3 张：轮播 -->
    <div
      v-else
      class="carousel-wrapper"
      ref="carouselRef"
      @mousedown="onDragStart"
      @mousemove="onDragMove"
      @mouseup="onDragEnd"
      @mouseleave="onDragEnd"
      @touchstart.prevent="onDragStart"
      @touchmove.prevent="onDragMove"
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
          <img :src="item.url" :alt="item.title" loading="lazy" />
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
const containerWidth = ref(0)
const isPlaying = ref(true)
const isDragging = ref(false)
const startPos = ref(0)
const dragTranslate = ref(0)
const isJumping = ref(false)

const AUTOPLAY_INTERVAL = 3000
const TRANSITION_MS = 500
const MOBILE_BP = 768

// ---------- 响应式 ----------

const isMobile = ref(false)
const visibleCount = computed(() => isMobile.value ? 3 : 5)
const cardGap = computed(() => isMobile.value ? 12 : 16)

// ---------- 数据：复制 2 份 ----------

const setCount = computed(() => props.artworks.length)
const loopItems = computed(() => {
  if (setCount.value === 0) return []
  return [...props.artworks, ...props.artworks]
})
const totalItems = computed(() => loopItems.value.length)

// ---------- 尺寸 ----------

const cardWidth = computed(() => {
  const w = containerWidth.value || 1200
  return w / visibleCount.value
})

const step = computed(() => cardWidth.value + cardGap.value)

// ---------- 位置 ----------
// pos: 当前聚焦在 loopItems 中的索引，范围 [0, 2*setCount-1]
// 播放策略：从 setCount 开始（第一份末尾/第二份开头），向右播到 2*setCount-1 后
// 静默跳回 setCount（因为 DOM[setCount] 和 DOM[0] 是同一张图）

const pos = ref(0)

const trackStyle = computed(() => {
  const center = containerWidth.value / 2 - cardWidth.value / 2
  const base = -pos.value * step.value
  const tx = center + base + dragTranslate.value
  return {
    transform: `translateX(${tx}px)`,
    transition: isJumping.value || isDragging.value
      ? 'none'
      : `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
  }
})

// ---------- 卡片样式 ----------

function getSlideStyle(index: number) {
  const distance = Math.abs(index - pos.value)
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
    const distance = Math.abs(index - pos.value)
    const scale = distance === 0 ? 1.08 : Math.max(0.55, 1 - distance * 0.14)
    const opacity = distance === 0 ? 1 : Math.max(0.3, 1 - distance * 0.18)
    const zIndex = Math.max(1, 20 - distance)
    const el = slide as HTMLElement
    el.style.transform = `scale(${scale})`
    el.style.opacity = opacity.toString()
    el.style.zIndex = zIndex.toString()
  })
}

// ---------- 播放 ----------

function goTo(target: number) {
  pos.value = target
  applyStyles()
}

function moveNext() {
  const next = pos.value + 1

  if (next >= totalItems.value) {
    // 到达末尾，静默跳回 setCount（同一张图）
    silentJump(setCount.value)
  } else {
    goTo(next)
  }
}

function movePrev() {
  if (pos.value > 0) {
    goTo(pos.value - 1)
  }
}

function silentJump(targetPos: number) {
  isJumping.value = true
  pos.value = targetPos
  applyStyles()

  // 双 rAF 确保浏览器完成无过渡渲染后再恢复
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isJumping.value = false
    })
  })
}

// ---------- 拖拽 ----------

function snapToNearest() {
  const snapped = Math.round(-dragTranslate.value / step.value)
  dragTranslate.value = 0

  let target = pos.value + snapped

  // 边界处理
  if (target < 0) target = 0
  if (target >= totalItems.value) target = totalItems.value - 1

  // 如果目标在"跳回区"（第一份数据），直接跳转到第二份的等价位置
  if (target < setCount.value) {
    target += setCount.value
  }

  goTo(target)
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
  const currentX = getClientX(e)
  dragTranslate.value = currentX - startPos.value

  const virtualPos = pos.value - dragTranslate.value / step.value

  const slides = trackRef.value?.querySelectorAll('.carousel-slide')
  slides?.forEach((slide, index) => {
    const distance = Math.abs(index - virtualPos)
    const scale = distance === 0 ? 1.08 : Math.max(0.55, 1 - distance * 0.14)
    const opacity = distance === 0 ? 1 : Math.max(0.3, 1 - distance * 0.18)
    const el = slide as HTMLElement
    el.style.transform = `scale(${scale})`
    el.style.opacity = opacity.toString()
  })
}

function onDragEnd(_e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  if (carouselRef.value) carouselRef.value.style.cursor = 'grab'
  snapToNearest()
  if (isPlaying.value) startAutoplay()
}

// ---------- 自动播放 ----------

let autoplayTimer: ReturnType<typeof setInterval> | null = null

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    if (isPlaying.value && !isDragging.value && !isJumping.value) {
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

// ---------- 生命周期 ----------

let resizeObserver: ResizeObserver | null = null
let mql: MediaQueryList | null = null
let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null

onMounted(() => {
  mql = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`)
  isMobile.value = mql.matches

  mqlHandler = () => {
    isMobile.value = mql!.matches
    applyStyles()
  }
  mql.addEventListener('change', mqlHandler)

  nextTick(() => {
    if (carouselRef.value) {
      carouselRef.value.style.cursor = 'grab'
      const update = () => {
        if (carouselRef.value) containerWidth.value = carouselRef.value.clientWidth
      }
      update()
      resizeObserver = new ResizeObserver(update)
      resizeObserver.observe(carouselRef.value)
    }

    // 从第二份数据开始（索引 = setCount）
    pos.value = setCount.value
    applyStyles()
    startAutoplay()
  })
})

onBeforeUnmount(() => {
  if (mql && mqlHandler) mql.removeEventListener('change', mqlHandler)
  resizeObserver?.disconnect()
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

/* === 静态行（< 3 张）=== */
.static-row {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 8px 0;
}
.static-item {
  flex-shrink: 0;
}
.static-item img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* === 轮播 === */
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