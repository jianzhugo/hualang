<template>
  <main>
    <canvas ref="speckleCanvas" class="page-speckles" aria-hidden="true"></canvas>
    <!-- Hero 区域 -->
    <section class="hero-section">
      <HeroBackground
        :src="heroBackground"
        alt="水墨山水画背景"
        class="hero-bg-media"
      />
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title gradient-text">小  小  艺  境</h1>
        <p class="hero-subtitle">小小的手，画出大大的世界；每一笔都是成长的足迹</p>
        <router-link to="/gallery" class="btn-primary text-lg px-8 h-12">
          浏览画廊
        </router-link>
      </div>
    </section>

    <!-- 棒标签最新作品 -->
    <section class="featured-showcase py-16 md:py-section featured-showcase-overlap">
      <div class="page-container featured-page-padding">
        <div class="section-title-wrap">
          <h2 class="section-title">优秀作品</h2>
        </div>
        <div class="cards-grid">
          <div v-for="artwork in bangArtworks" :key="artwork.key" class="artwork-card">
            <div class="card-image-wrap">
              <img :src="artwork.url" :alt="artwork.title" loading="lazy" />
            </div>
            <div class="card-info">
              <p class="card-title">{{ artwork.title }}</p>
              <div class="card-author-row">
                <img v-if="getAuthorAvatar(artwork.author)" :src="getAuthorAvatar(artwork.author)" :alt="artwork.author" class="card-author-avatar" />
                <span class="card-author">{{ artwork.author }}</span>
                <span class="card-date">{{ formatDate(artwork.createdDate || artwork.date) }}</span>
              </div>
            </div>
          </div>
          <div v-for="n in (4 - bangArtworks.length)" :key="'empty-' + n" class="artwork-card artwork-card-empty">
            <div class="card-image-wrap">
              <div class="card-placeholder"></div>
            </div>
            <div class="card-info">
              <p class="card-author">&nbsp;</p>
              <p class="card-title">&nbsp;</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 作者作品轮播展示 -->
    <section class="artist-showcase py-16 md:py-section">
      <div class="page-container">
        <AuthorCarousel
          v-for="authorData in carouselAuthors"
          :key="authorData.name"
          :author-name="authorData.name"
          :author-pinyin="authorData.pinyin"
          :subtitle="authorData.subtitle"
          :subtitle-pinyin="authorData.subtitlePinyin"
          :artworks="authorData.artworks"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGalleryStore } from '../stores/gallery'
import type { ArtworkItem } from '../stores/gallery'
import HeroBackground from '../components/HeroBackground.vue'
import AuthorCarousel from '../components/AuthorCarousel.vue'
// 作者头像
import avatarXinxinNew from '../assets/TX-X.jpg'
import avatarSongbaoNew from '../assets/TX-S.jpg'
// Hero 背景
import heroBgImage from '../assets/shangchuan-bg.webp'

const AUTHOR_AVATARS: Record<string, string> = {
  '馨馨': avatarXinxinNew,
  '松宝': avatarSongbaoNew
}

const AUTHOR_PINYIN: Record<string, string> = {
  '馨馨': 'XIN XIN',
  '松宝': 'SONG BAO'
}

const AUTHOR_SUBTITLE: Record<string, string> = {
  '馨馨': '近期佳作',
  '松宝': '近期佳作'
}

const AUTHOR_SUBTITLE_PINYIN: Record<string, string> = {
  '馨馨': 'JIN QI JIA ZUO',
  '松宝': 'JIN QI JIA ZUO'
}

const getAuthorAvatar = (author: string): string => {
  return AUTHOR_AVATARS[author] || ''
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  return dateStr.replace(/-/g, '.')
}

const galleryStore = useGalleryStore()
const isMobile = ref(false)
// 切换到视频：只需改成视频路径即可ref('/assets/your-video.mp4')
const heroBackground = ref(heroBgImage)

const speckleCanvas = ref<HTMLCanvasElement | null>(null)
let speckleFrameId = 0

interface Speckle {
  x: number; y: number; r: number; a: number; speed: number; phase: number; gold: boolean
}

function initSpeckles() {
  const canvas = speckleCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  if (!ctx) return

  const dpr = Math.min(window.devicePixelRatio, 2)
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.scale(dpr, dpr)

  const count = Math.floor(w * h / 2000)
  const dots: Speckle[] = []
  for (let i = 0; i < count; i++) {
    dots.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.4 + Math.random() * 1.8,
      a: 0.12 + Math.random() * 0.5,
      speed: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      gold: Math.random() < 0.2
    })
  }

  const start = performance.now() / 1000

  function draw() {
    const t = performance.now() / 1000 - start
    ctx.clearRect(0, 0, w, h)
    for (const d of dots) {
      const alpha = d.a * (0.5 + 0.5 * Math.sin(t * d.speed + d.phase))
      ctx.beginPath()
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
      if (d.gold) {
        ctx.fillStyle = `rgba(255,210,100,${alpha})`
      } else {
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
      }
      ctx.fill()
    }
    speckleFrameId = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(() => {
  galleryStore.fetchGallery()
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
  initSpeckles()
})

onUnmounted(() => {
  cancelAnimationFrame(speckleFrameId)
})

const authorArtworks = computed(() => {
  const map = new Map<string, ArtworkItem[]>()
  galleryStore.artworks.forEach((a) => {
    if (!map.has(a.author)) {
      map.set(a.author, [])
    }
    map.get(a.author)!.push(a)
  })
  map.forEach((list) => {
    list.sort((a, b) => {
      const da = a.createdDate || a.date
      const db = b.createdDate || b.date
      return db.localeCompare(da)
    })
  })
  return map
})

const bangArtworks = computed<ArtworkItem[]>(() => {
  const sorted = [...galleryStore.artworks].sort((a, b) => {
    const da = a.createdDate || a.date
    const db = b.createdDate || b.date
    return db.localeCompare(da)
  })
  const bang = sorted.filter((a) => a.tags?.includes('棒'))
  return bang.slice(0, 4)
})

const carouselAuthors = computed(() => {
  const targetAuthors = ['馨馨', '松宝']
  return targetAuthors.map((name) => {
    const artworks = authorArtworks.value.get(name) || []
    const topArtworks = artworks.slice(0, 8)
    return {
      name,
      pinyin: AUTHOR_PINYIN[name] || name.toUpperCase(),
      subtitle: AUTHOR_SUBTITLE[name] || '',
      subtitlePinyin: AUTHOR_SUBTITLE_PINYIN[name] || '',
      artworks: topArtworks,
      isReversed: name === '松宝'
    }
  })
})
</script>

<style scoped>
.gradient-text {
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

.hero-bg-media {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.page-speckles {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  width: 100%;
  height: 100%;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(18, 18, 18, 0.3) 0%,
    transparent 30%,
    transparent 40%,
    rgba(18, 18, 18, 0.6) 70%,
    rgba(18, 18, 18, 0.95) 90%,
    rgba(18, 18, 18, 1) 100%
  );
  pointer-events: none;
  z-index: 2;
}

/* 优秀卡片 */
.featured-showcase {
  background-color: transparent;
  position: relative;
  z-index: 5;
  margin-top: -50vh;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.featured-page-padding {
  padding-top: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 24px;
  text-align: center;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.artwork-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: var(--color-surface-card);
}

.artwork-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.card-image-wrap {
  width: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
  background-color: var(--color-surface-soft);
}

.card-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.artwork-card:hover .card-image-wrap img {
  transform: scale(1.05);
}

.card-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-surface-soft);
}

.card-info {
  padding: 12px 16px;
  background: var(--color-surface-card);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-author-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.card-author {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-mute);
  margin: 0;
}

.card-date {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-ash);
  margin-left: auto;
}

.section-title-wrap {
  text-align: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0;
  display: inline-block;
  padding: 12px 36px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  position: relative;
  z-index: 1;
}

.section-title::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 21px;
  padding: 1px;
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
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
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

.cards-grid-wrap {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .cards-grid {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 12px;
    padding-bottom: 8px;
    scrollbar-width: thin;
    scrollbar-color: #ff6b8a rgba(255, 255, 255, 0.1);
  }

  .cards-grid::-webkit-scrollbar {
    height: 6px;
  }

  .cards-grid::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }

  .cards-grid::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, #ff6b8a, #ffb366);
    border-radius: 10px;
  }

  .artwork-card {
    flex: 0 0 calc(50% - 6px);
    scroll-snap-align: start;
  }
}
</style>
