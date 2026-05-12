<template>
  <main>
    <!-- Hero 区域 -->
    <section class="hero-section">
      <HeroBackground
        :src="heroBackground"
        alt="水墨山水画背景"
        class="hero-bg-media"
      />
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title">小  小  艺  境</h1>
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
          :artworks="authorData.artworks"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
      artworks: topArtworks,
      isReversed: name === '松宝'
    }
  })
})
</script>

<style scoped>
.hero-bg-media {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(248, 250, 252, 0.4) 0%,
    rgba(248, 250, 252, 0.15) 30%,
    transparent 50%,
    rgba(248, 250, 252, 0.15) 70%,
    rgba(248, 250, 252, 0.4) 100%
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: #ffffff;
}

.artwork-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  transition: transform 0.3s ease;
}

.artwork-card:hover .card-image-wrap img {
  transform: scale(1.05);
}

.card-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f3f4f6;
}

.card-info {
  padding: 12px 16px;
  background: #ffffff;
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
  background: rgba(255, 255, 255, 0.5);
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
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .artwork-card:nth-child(n+3) {
    display: none;
  }
}
</style>
