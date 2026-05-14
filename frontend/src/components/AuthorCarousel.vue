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
        :style="{ width: cardWidth + 'px' }"
      >
        <img :src="item.url" :alt="item.title" loading="lazy" />
      </div>
    </div>

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
          v-for="(item, idx) in loopItems"
          :key="`${item.key}-${idx}`"
          class="carousel-slide"
          :style="{ width: cardWidth + 'px' }"
        >
          <img :src="item.url" :alt="item.title" loading="lazy" />
        </div>
      </div>
    </div>

    <div class="carousel-dots" v-if="artworks.length >= 3">
      <button
        v-for="(_, i) in setCount"
        :key="i"
        class="carousel-dot"
        :class="{ active: i === focusModulo }"
        :aria-label="`第 ${i + 1} 张`"
        @click="goToReal(i)"
      />
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

const SCROLL_TIME_S = 0.5
const DISPLAY_TIME_S = 2.5
const MOBILE_BP = 768

const isMobile = ref(false)
const visibleCount = computed(() => isMobile.value ? 3 : 5)
const safeLeft = computed(() => Math.floor(visibleCount.value / 2))

const cardWidth = computed(() => {
  const w = containerWidth.value || 1200
  const gaps = (visibleCount.value - 1) * cardGap.value
  return (w - gaps) / visibleCount.value
})
const cardGap = computed(() => isMobile.value ? 12 : 16)
const step = computed(() => cardWidth.value + cardGap.value)

// ---- 数据 ----
const setCount = computed(() => props.artworks.length)

const loopItems = computed(() => {
  if (setCount.value === 0) return []
  const items: ArtworkItem[] = []
  for (let c = 0; c < 2; c++) {
    items.push(...props.artworks)
  }
  return items
})

// ---- 时间参数 ----
const totalDurationMs = computed(() =>
  (DISPLAY_TIME_S + SCROLL_TIME_S) * setCount.value * 1000
)
const stepDurationMs = computed(() =>
  (DISPLAY_TIME_S + SCROLL_TIME_S) * 1000
)
const displayMs = DISPLAY_TIME_S * 1000
const scrollMs = SCROLL_TIME_S * 1000

// ---- 焦点指示器 ----
const focusModulo = ref(0)

// ---- 拖拽状态 ----
const isDragging = ref(false)
const dragStartX = ref(0)
const dragOffsetX = ref(0)
const inDragMode = ref(false)

// ---- 轨道样式（仅 gap + 拖拽 transform，不再含 animation） ----
const trackStyle = computed(() => {
  const base: Record<string, string> = {
    gap: `${cardGap.value}px`
  }

  if (inDragMode.value) {
    const center = (containerWidth.value || 1200) / 2 - cardWidth.value / 2
    base.transform = `translateX(${center - dragOffsetX.value}px)`
  }

  return base
})

// ====================================================================
//  WAAPI 动画引擎 — 完全替代 CSS @keyframes，零注入，零时序问题
// ====================================================================
let anim: Animation | null = null

function buildKeyframes(): Keyframe[] {
  const n = setCount.value
  const s = step.value
  const center = (containerWidth.value || 1200) / 2 - cardWidth.value / 2
  const total = totalDurationMs.value

  const kfs: Keyframe[] = []
  let t = 0

  for (let i = 0; i < n; i++) {
    const pos = safeLeft.value + i
    const tx = center - pos * s

    // 停留阶段
    if (i === 0) {
      kfs.push({ transform: `translateX(${tx.toFixed(1)}px)`, offset: 0 })
    }
    t += displayMs
    kfs.push({ transform: `translateX(${tx.toFixed(1)}px)`, offset: Math.min(t / total, 1) })

    // 滚动阶段 → 下一位置（最后一个到 safeLeft+n，视觉 = safeLeft）
    const nextTx = center - (safeLeft.value + i + 1) * s
    t += scrollMs
    kfs.push({ transform: `translateX(${nextTx.toFixed(1)}px)`, offset: Math.min(t / total, 1) })
  }

  return kfs
}

function startAnim() {
  stopAnim()
  const track = trackRef.value
  if (!track) return

  const kfs = buildKeyframes()
  if (kfs.length === 0) return

  anim = track.animate(kfs, {
    duration: totalDurationMs.value,
    iterations: Infinity,
    easing: 'linear'
  })
}

function stopAnim() {
  if (anim) {
    anim.cancel()
    anim = null
  }
}

// ====================================================================
//  焦点计算（与 WAAPI 关键帧时序精确一致）
// ====================================================================
function computeVisualFocus(currentTime: number): number {
  const totalMs = totalDurationMs.value || 1
  const stepMs = stepDurationMs.value || 1

  const t = ((currentTime % totalMs) + totalMs) % totalMs
  const stepIndex = Math.min(Math.floor(t / stepMs), setCount.value - 1)
  const stepTime = t - stepIndex * stepMs

  if (stepTime < displayMs) {
    return safeLeft.value + stepIndex
  }
  const progress = Math.min((stepTime - displayMs) / scrollMs, 1)
  return safeLeft.value + stepIndex + progress
}

// ====================================================================
//  rAF 同步：每帧更新卡片样式（scale + Figma 风格 translateX 靠拢偏移）
// ====================================================================
let syncRafId = 0

function updateSlideStyles(visualFocus: number) {
  const track = trackRef.value
  if (!track) return

  // Figma 的偏移常数：基于卡片宽度的比例
  //   scale(1) → translateX(0)
  //   scale(0.8) → translateX(±1.625rem ≈ ±0.3 × cardWidth)
  //   scale(0.7) → translateX(±6.875rem ≈ ±1.25 × cardWidth)
  const cw = cardWidth.value
  const nearOffset = cw * 0.3   // 相邻卡片向中心靠拢的量
  const farOffset = cw * 0.85   // 远处卡片向中心靠拢的量

  const slides = track.querySelectorAll<HTMLElement>('.carousel-slide')
  slides.forEach((slide, idx) => {
    const rawDist = idx - visualFocus
    const absDist = Math.abs(rawDist)
    const sign = rawDist < 0 ? -1 : rawDist > 0 ? 1 : 0

    // scale：中心 1.08，按距离递减
    const scale = absDist < 0.5 ? 1.08
      : absDist < 1.5 ? 0.85
      : Math.max(0.55, 1 - absDist * 0.14)
    const opacity = absDist < 0.5 ? 1
      : absDist < 1.5 ? 0.75
      : Math.max(0.25, 1 - absDist * 0.2)
    const z = Math.max(1, Math.floor(20 - absDist))

    // translateX：向中心靠拢（Figma 核心效果）
    let tx = 0
    if (absDist > 0) {
      if (absDist < 1.5) {
        tx = sign * nearOffset * absDist
      } else {
        tx = sign * (nearOffset * 1 + farOffset * (absDist - 1))
      }
    }

    slide.style.transform = `translateX(${tx}px) scale(${scale})`
    slide.style.opacity = String(opacity)
    slide.style.zIndex = String(z)
  })
}

function startSync() {
  stopSync()

  function tick() {
    if (inDragMode.value) {
      syncRafId = requestAnimationFrame(tick)
      return
    }

    if (anim && anim.currentTime !== null) {
      const timeMs = typeof anim.currentTime === 'number' ? anim.currentTime : Number(anim.currentTime.toString())
      const visualFocus = computeVisualFocus(timeMs)
      const mod = Math.round(visualFocus) % setCount.value
      if (mod !== focusModulo.value) {
        focusModulo.value = mod
      }
      updateSlideStyles(visualFocus)
    } else {
      updateSlideStyles(safeLeft.value)
    }

    syncRafId = requestAnimationFrame(tick)
  }

  syncRafId = requestAnimationFrame(tick)
}

function stopSync() {
  if (syncRafId) {
    cancelAnimationFrame(syncRafId)
    syncRafId = 0
  }
}

// ---- 拖拽 ----

function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientX
  return (e as MouseEvent).clientX
}

function onDragStart(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  dragStartX.value = getClientX(e)

  // 从 WAAPI 读取当前视觉偏移
  if (anim && anim.currentTime !== null) {
    anim.pause()
    anim.commitStyles()
    const timeMs = typeof anim.currentTime === 'number' ? anim.currentTime : Number(anim.currentTime.toString())
    dragOffsetX.value = computeVisualFocus(timeMs) * step.value
  } else {
    dragOffsetX.value = safeLeft.value * step.value
  }

  inDragMode.value = true
  if (carouselRef.value) carouselRef.value.style.cursor = 'grabbing'
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return

  const delta = getClientX(e) - dragStartX.value
  const newVisualFocus = dragOffsetX.value / step.value - delta / step.value
  dragOffsetX.value = newVisualFocus * step.value

  updateSlideStyles(newVisualFocus)
}

function onDragEnd(_e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  if (carouselRef.value) carouselRef.value.style.cursor = 'grab'

  const visualFocus = dragOffsetX.value / step.value
  const clamped = Math.max(
    safeLeft.value,
    Math.min(Math.round(visualFocus), setCount.value + safeLeft.value - 1)
  )

  dragOffsetX.value = 0
  inDragMode.value = false

  const targetStep = clamped - safeLeft.value

  if (anim) {
    anim.currentTime = (targetStep * stepDurationMs.value + displayMs / 2) as CSSNumberish
    anim.play()
  } else {
    startAnim()
  }

  focusModulo.value = clamped % setCount.value
}

// ---- 点击指示器 ----

function goToReal(realIndex: number) {
  focusModulo.value = realIndex

  if (!anim) {
    startAnim()
  }
  if (anim) {
    anim.currentTime = (realIndex * stepDurationMs.value + displayMs / 2) as CSSNumberish
    anim.play()
  }
}

// ---- 生命周期 ----

let resizeObserver: ResizeObserver | null = null
let mql: MediaQueryList | null = null
let mqlHandler: ((e: MediaQueryListEvent) => void) | null = null

onMounted(() => {
  mql = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`)
  isMobile.value = mql.matches

  mqlHandler = () => {
    isMobile.value = mql!.matches
    nextTick(() => {
      focusModulo.value = 0
      startAnim()
    })
  }
  mql.addEventListener('change', mqlHandler)

  nextTick(() => {
    if (carouselRef.value) {
      carouselRef.value.style.cursor = 'grab'

      const measure = () => {
        if (carouselRef.value) {
          containerWidth.value = carouselRef.value.clientWidth
        }
      }
      measure()

      resizeObserver = new ResizeObserver(() => {
        measure()
        if (!inDragMode.value) {
          stopAnim()
          nextTick(() => startAnim())
        }
      })
      resizeObserver.observe(carouselRef.value)
    }

    focusModulo.value = 0
    startAnim()
    requestAnimationFrame(() => startSync())
  })
})

onBeforeUnmount(() => {
  if (mql && mqlHandler) mql.removeEventListener('change', mqlHandler)
  resizeObserver?.disconnect()
  stopAnim()
  stopSync()
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
}
.static-item img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
  align-items: center;
  will-change: transform;
}
.carousel-slide {
  flex-shrink: 0;
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
  .carousel-wrapper {
    padding: 24px 0;
  }
  .carousel-dots {
    margin-top: 16px;
  }
}
</style>