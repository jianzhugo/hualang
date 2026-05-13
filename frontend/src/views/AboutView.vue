<template>
  <div class="about-page">
    <div class="gradient" ref="gradientRef"></div>
    <main class="page-container py-8 content-layer">
      <h1
        class="text-heading-xl font-bold tracking-tight text-ink mb-2 text-center"
        style="letter-spacing: -1.2px;"
      >
        关于我们
      </h1>
      <p class="text-body-md text-mute mb-10 text-center">了解儿童画廊的故事</p>

      <!-- 项目介绍 -->
      <section class="mb-12">
        <div class="feature-card">
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
      <section class="mb-12">
        <h2 class="text-heading-lg font-semibold text-ink mb-6">未来之星</h2>
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
            <p class="text-body-md font-semibold text-ink">{{ item.name }}</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGalleryStore } from '../stores/gallery';
import avatarXinxinNew from '../assets/TX-X.jpg';
import avatarSongbaoNew from '../assets/TX-S.jpg';

const AUTHOR_AVATARS: Record<string, string> = {
  '馨馨': avatarXinxinNew,
  '松宝': avatarSongbaoNew
};

const galleryStore = useGalleryStore();

const authorList = computed(() => {
  const seen = new Set<string>();
  const result: { name: string; avatar: string }[] = [];
  galleryStore.artworks.forEach((a) => {
    const name = a.author?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push({
        name,
        avatar: AUTHOR_AVATARS[name] || ''
      });
    }
  });
  return result;
});

const gradientRef = ref<HTMLDivElement | null>(null);

const onMouseMove = (event: MouseEvent) => {
  if (gradientRef.value) {
    gradientRef.value.style.backgroundImage = 'radial-gradient(at ' + event.clientX + 'px ' + event.clientY + 'px, rgba(83,227,166,.8) 0, #50a3a2 50%)';
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
  background-image: radial-gradient(at 300px 300px, rgba(83,227,166,.8) 0, #50a3a2 70%);
}

.content-layer {
  position: relative;
  z-index: 1;
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
  background: rgba(255, 255, 255, 0.75);
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
}

.author-avatar-placeholder {
  width: 80%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--color-surface-card, #f3f4f6);
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

:deep(.feature-card) {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>