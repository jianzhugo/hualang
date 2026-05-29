<template>
  <div class="about-page">
    <div class="gradient" ref="gradientRef"></div>
    <main class="page-container py-8 content-layer">
      <h1
        class="about-hero-title font-bold tracking-tight mb-2 text-center gradient-text"
        style="letter-spacing: -1.2px;"
      >
        关 于 我 们
      </h1>
      <p class="about-hero-subtitle text-mute mb-10 text-center">了解儿童画廊的故事</p>

      <!-- 项目介绍 -->
      <section class="mb-12">
        <div class="feature-card text-center">
          <h2 class="text-heading-lg font-semibold text-ink mb-4">项目介绍</h2>
          <p class="text-body-md text-body leading-relaxed mb-4">
            儿童画廊是一个为家庭打造的纯静态画作展示网站。我们的初衷很简单：让孩子的每一幅画作都有一个安全、美观的展示空间。
          </p>
          <p class="text-body-md text-body leading-relaxed">
            采用 Vue3 + Cloudflare R2/Workers 架构，无需服务器维护，低成本高可用。画作在前端自动压缩为 WebP 格式，节省存储空间的同时保持清晰画质。
          </p>
        </div>
      </section>

      <!-- 未来之星 -->
      <section class="mb-12 text-center">
        <div class="section-title-wrap">
          <h2 class="text-heading-lg font-semibold text-ink mb-2">未来之星<span class="section-subtitle-sep"> • </span><span class="section-subtitle">小作者们</span></h2>
          <p class="section-subtitle-en">Rising Stars</p>
        </div>
        <div class="author-grid">
          <div
            v-for="item in authorList"
            :key="item.name"
            class="author-card"
          >
            <img
              v-if="item.avatar"
              :src="item.avatar"
              :alt="item.name"
              class="author-avatar"
            />
            <div v-else class="author-avatar-placeholder">
              {{ item.name.charAt(0) }}
            </div>
            <p class="text-body-md font-semibold text-ink">{{ item.name }}<span v-if="item.pinyin" class="author-name-pinyin-sep"> • </span><span v-if="item.pinyin" class="author-name-pinyin">{{ item.pinyin }}</span></p>
            <p v-if="item.bio" class="author-bio">{{ item.bio }}</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGalleryStore } from '../stores/gallery';
import { getAuthor } from '../composables/useAuthors';

const galleryStore = useGalleryStore();

const authorList = computed(() => {
  const seen = new Set<string>();
  const result: { name: string; avatar: string; pinyin: string; bio: string }[] = [];
  galleryStore.artworks.forEach((a) => {
    const name = a.author?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      const info = getAuthor(name);
      result.push({
        name,
        avatar: info?.avatar || '',
        pinyin: info?.pinyin || '',
        bio: info?.bio || ''
      });
    }
  });
  return result;
});

const gradientRef = ref<HTMLDivElement | null>(null);

const onMouseMove = (event: MouseEvent) => {
  if (gradientRef.value) {
    gradientRef.value.style.backgroundImage = 'radial-gradient(at ' + event.clientX + 'px ' + event.clientY + 'px, rgba(189, 188, 162, 0.5) 0, #121212 25%)';
  }
};

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  galleryStore.fetchGallery();
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
});
</script>

<style scoped>
.about-hero-title {
  font-size: 36px;
  line-height: 1.1;
}

@media (min-width: 768px) {
  .about-hero-title {
    font-size: 48px;
  }
}

@media (min-width: 1024px) {
  .about-hero-title {
    font-size: 64px;
  }
}

.about-hero-subtitle {
  font-size: 16px;
  line-height: 1.6;
}

@media (min-width: 768px) {
  .about-hero-subtitle {
    font-size: 22px;
  }
}

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

.about-page {
  position: relative;
  min-height: 100vh;
  background-image: url('../assets/shangchuan-bg.webp');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.gradient {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-image: radial-gradient(at 300px 300px, rgba(189, 188, 162, 0.5) 0, #121212 30%);
}

.content-layer {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.author-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 576px;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .author-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.author-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
}

.author-avatar {
  width: 80%;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 16px;
  display: block;
  animation: avatarBreath 3s ease-in-out infinite;
}

@keyframes avatarBreath {
  0%, 100% {
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.7), 0 0 40px rgba(255, 255, 255, 0.2);
  }
}

.author-avatar-placeholder {
  width: 80%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--color-surface-card);
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.author-pinyin {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-ash);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 4px 0 0;
}

.section-title-wrap {
  margin-bottom: 24px;
}

.section-subtitle-sep {
  font-weight: 400;
  opacity: 0.5;
}

.section-subtitle {
  font-weight: 400;
  opacity: 0.7;
}

.section-subtitle-en {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-ash);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 4px 0 0;
}

.author-name-pinyin-sep {
  font-weight: 400;
  opacity: 0.4;
}

.author-name-pinyin {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-mute);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.author-bio {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-stone);
  line-height: 1.5;
  margin: 8px 0 0;
}

:deep(.feature-card) {
  background: rgba(255, 255, 255, 0.06) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>