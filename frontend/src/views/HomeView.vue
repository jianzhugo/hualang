<template>
  <main>
    <!-- Hero 区域 -->
    <section class="hero-section">
      <PhotoSphere v-if="!isMobile" :artworks="galleryStore.artworks" class="hero-3d-bg" />
      <svg v-if="isMobile" class="hero-bg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="g1" cx="20%" cy="30%" r="50%">
            <stop offset="0%" stop-color="#ffe0e6"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
          <radialGradient id="g2" cx="75%" cy="25%" r="45%">
            <stop offset="0%" stop-color="#ffe8d6"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
          <radialGradient id="g3" cx="50%" cy="65%" r="40%">
            <stop offset="0%" stop-color="#e8ffe8"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
          <radialGradient id="g4" cx="85%" cy="75%" r="35%">
            <stop offset="0%" stop-color="#e0f0ff"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
          <radialGradient id="g5" cx="15%" cy="80%" r="40%">
            <stop offset="0%" stop-color="#f0e0ff"/>
            <stop offset="100%" stop-color="transparent"/>
          </radialGradient>
          <linearGradient id="fg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff6b8a"/>
            <stop offset="100%" stop-color="#ff8fa8"/>
          </linearGradient>
          <linearGradient id="fg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffb366"/>
            <stop offset="100%" stop-color="#ffc999"/>
          </linearGradient>
          <linearGradient id="fg3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7ec87e"/>
            <stop offset="100%" stop-color="#a8e6a8"/>
          </linearGradient>
          <linearGradient id="fg4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#66b3e6"/>
            <stop offset="100%" stop-color="#99ccff"/>
          </linearGradient>
          <linearGradient id="fg5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#b388e6"/>
            <stop offset="100%" stop-color="#cc99ff"/>
          </linearGradient>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3"/>
          </filter>
        </defs>
        <rect width="1920" height="800" fill="#f8f9fa"/>
        <rect width="1920" height="800" fill="url(#g1)" opacity="0.8"/>
        <rect width="1920" height="800" fill="url(#g2)" opacity="0.7"/>
        <rect width="1920" height="800" fill="url(#g3)" opacity="0.6"/>
        <rect width="1920" height="800" fill="url(#g4)" opacity="0.7"/>
        <rect width="1920" height="800" fill="url(#g5)" opacity="0.6"/>
        <circle cx="280" cy="180" r="70" fill="url(#fg1)" opacity="0.25" filter="url(#softBlur)"/>
        <circle cx="1450" cy="120" r="55" fill="url(#fg2)" opacity="0.3" filter="url(#softBlur)"/>
        <circle cx="960" cy="450" r="90" fill="url(#fg3)" opacity="0.2" filter="url(#softBlur)"/>
        <circle cx="1650" cy="550" r="65" fill="url(#fg4)" opacity="0.25" filter="url(#softBlur)"/>
        <circle cx="200" cy="580" r="80" fill="url(#fg5)" opacity="0.2" filter="url(#softBlur)"/>
        <circle cx="600" cy="350" r="40" fill="url(#fg1)" opacity="0.3" filter="url(#softBlur)"/>
        <circle cx="1200" cy="300" r="50" fill="url(#fg4)" opacity="0.25" filter="url(#softBlur)"/>
        <circle cx="400" cy="500" r="35" fill="url(#fg2)" opacity="0.3" filter="url(#softBlur)"/>
        <circle cx="1700" cy="250" r="45" fill="url(#fg3)" opacity="0.2" filter="url(#softBlur)"/>
        <circle cx="800" cy="600" r="60" fill="url(#fg5)" opacity="0.15" filter="url(#softBlur)"/>
        <ellipse cx="500" cy="200" rx="120" ry="80" fill="url(#fg1)" opacity="0.1" filter="url(#softBlur)" transform="rotate(-15 500 200)"/>
        <ellipse cx="1300" cy="500" rx="100" ry="60" fill="url(#fg4)" opacity="0.12" filter="url(#softBlur)" transform="rotate(20 1300 500)"/>
        <path d="M100,100 L115,130 L100,120 L85,130 Z" fill="#ffb3cc" opacity="0.6"/>
        <path d="M1750,80 L1760,100 L1750,95 L1740,100 Z" fill="#ff9999" opacity="0.5"/>
        <path d="M350,600 L365,630 L350,620 L335,630 Z" fill="#99ccff" opacity="0.5"/>
        <path d="M1550,400 L1565,430 L1550,420 L1535,430 Z" fill="#cc99ff" opacity="0.5"/>
        <path d="M700,150 L710,170 L700,165 L690,170 Z" fill="#ffcc80" opacity="0.5"/>
        <path d="M1100,550 L1110,570 L1100,565 L1090,570 Z" fill="#80cc80" opacity="0.5"/>
        <path d="M1800,300 L1815,320 L1800,315 L1785,320 Z" fill="#ff9999" opacity="0.4"/>
        <path d="M150,450 L160,470 L150,465 L140,470 Z" fill="#99ccff" opacity="0.4"/>
        <circle cx="100" cy="300" r="6" fill="#ff6b8a" opacity="0.3"/>
        <circle cx="1850" cy="200" r="5" fill="#ffb366" opacity="0.3"/>
        <circle cx="1750" cy="650" r="4" fill="#7ec87e" opacity="0.3"/>
        <circle cx="120" cy="680" r="5" fill="#66b3e6" opacity="0.3"/>
        <circle cx="900" cy="100" r="4" fill="#b388e6" opacity="0.3"/>
        <circle cx="1400" cy="700" r="5" fill="#ff6b8a" opacity="0.25"/>
        <circle cx="600" cy="720" r="4" fill="#ffb366" opacity="0.25"/>
        <circle cx="350" cy="80" r="5" fill="#66b3e6" opacity="0.25"/>
      </svg>
      <div class="hero-gradient-overlay hero-gradient-overlay-3d"></div>
      <div class="hero-content">
        <h1 class="hero-title">小小艺境</h1>
        <p class="hero-subtitle">每一笔都是成长的足迹</p>
        <router-link to="/gallery" class="btn-primary text-lg px-8 h-12">
          浏览画廊
        </router-link>
      </div>
    </section>

    <!-- 作者作品滚动展示 -->
    <section class="artist-showcase py-16 md:py-section">
      <div class="page-container">
        <div
          v-for="authorRow in authorRows"
          :key="authorRow.name"
          class="artist-row"
          :class="{ 'artist-row-reverse': authorRow.isReversed }"
        >
          <div v-if="!authorRow.isReversed" class="artist-info">
            <h3 class="artist-name">{{ authorRow.name }}</h3>
            <p class="artist-latest-label">最新作品</p>
          </div>
          <div class="scroll-track-wrapper" :class="{ 'scroll-track-wrapper-reversed': authorRow.isReversed }">
            <div class="scroll-track" :style="{ animationDuration: authorRow.duration }" :class="authorRow.direction">
              <div
                v-for="(artwork, idx) in authorRow.duplicatedArtworks"
                :key="`${artwork.key}-${idx}`"
                class="scroll-item"
              >
                <img
                  :src="artwork.url"
                  :alt="artwork.title"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          <div v-if="authorRow.isReversed" class="artist-info">
            <h3 class="artist-name">{{ authorRow.name }}</h3>
            <p class="artist-latest-label">最新作品</p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGalleryStore } from '../stores/gallery'
import type { ArtworkItem } from '../stores/gallery'
import PhotoSphere from '../components/PhotoSphere.vue'

const galleryStore = useGalleryStore()
const isMobile = ref(false)

onMounted(() => {
  galleryStore.fetchGallery()
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
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

interface AuthorRow {
  name: string
  artworks: ArtworkItem[]
  duplicatedArtworks: ArtworkItem[]
  latest: ArtworkItem | null
  duration: string
  direction: string
  isReversed: boolean
}

const authorRows = computed<AuthorRow[]>(() => {
  const targetAuthors = ['馨馨', '松宝']
  const rows: AuthorRow[] = []

  targetAuthors.forEach((name) => {
    const artworks = authorArtworks.value.get(name) || []
    const latest = artworks.length > 0 ? artworks[0] : null
    const top5 = artworks.slice(0, 5)
    const duplicated = [...top5, ...top5]
    const duration = `${top5.length * 4}s`
    const isReversed = name === '松宝'
    const direction = isReversed ? 'scrollRight' : 'scrollLeft'

    rows.push({
      name,
      artworks: top5,
      duplicatedArtworks: duplicated,
      latest,
      duration,
      direction,
      isReversed
    })
  })

  return rows
})
</script>

<style scoped>
.hero-3d-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
}

@media (max-width: 768px) {
  .hero-3d-bg {
    display: none;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.artist-showcase {
  background-color: var(--color-surface-soft);
}

.artist-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;
  padding: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  background: linear-gradient(var(--color-surface-soft), var(--color-surface-soft)) padding-box,
    linear-gradient(135deg, #ff6b8a, #ffb366, #7ec87e, #66b3e6) border-box;
  border-radius: 12px;
}

.artist-row:last-child {
  margin-bottom: 0;
}

.artist-row-reverse {
  background: linear-gradient(var(--color-surface-soft), var(--color-surface-soft)) padding-box,
    linear-gradient(135deg, #66b3e6, #7ec87e, #ffb366, #ff6b8a) border-box;
}

.artist-info {
  flex-shrink: 0;
  flex-basis: 30%;
  text-align: center;
  padding-top: 8px;
}

.artist-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 12px;
  letter-spacing: -0.5px;
}

.artist-latest-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-mute);
  margin: 0;
}

.scroll-track-wrapper {
  flex: 0 0 70%;
  overflow: hidden;
  position: relative;
}

.scroll-track-wrapper::before,
.scroll-track-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 60px;
  z-index: 2;
  pointer-events: none;
}

.scroll-track-wrapper::before {
  left: 0;
  background: linear-gradient(to right, var(--color-surface-soft), transparent);
}

.scroll-track-wrapper::after {
  right: 0;
  background: linear-gradient(to left, var(--color-surface-soft), transparent);
}

.scroll-track {
  display: flex;
  gap: 12px;
  animation: scrollLeft linear infinite;
}

.scroll-track:hover {
  animation-play-state: paused;
}

.scroll-track.scrollRight {
  animation: scrollRight linear infinite;
}

.scroll-track.scrollRight:hover {
  animation-play-state: paused;
}

@keyframes scrollLeft {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes scrollRight {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
}

.scroll-track-wrapper-reversed {
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.scroll-track-wrapper-reversed::before {
  left: auto;
  right: 0;
  background: linear-gradient(to left, var(--color-surface-soft), transparent);
}

.scroll-track-wrapper-reversed::after {
  right: auto;
  left: 0;
  background: linear-gradient(to right, var(--color-surface-soft), transparent);
}

.scroll-item {
  flex-shrink: 0;
  width: 180px;
  transition: transform 0.3s ease, opacity 0.3s ease;
  position: relative;
}

.scroll-item:hover {
  transform: scale(1.08);
  z-index: 3;
}

.scroll-track:hover .scroll-item:not(:hover) {
  opacity: 0.4;
}

.scroll-item img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform;
}

.scroll-item:hover img {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.scroll-item-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-body);
  margin: 6px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .artist-row {
    flex-direction: column;
    align-items: stretch;
  }

  .artist-info {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding-top: 0;
  }

  .artist-name {
    margin: 0;
    white-space: nowrap;
  }

  .artist-latest-label {
    display: none;
  }

  .scroll-item {
    width: 140px;
  }
}
</style>
