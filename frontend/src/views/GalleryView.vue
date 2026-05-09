<template>
  <main class="max-w-7xl mx-auto px-4 md:px-6 py-8">
    <h1
      class="text-heading-xl font-bold tracking-tight text-ink mb-2"
      style="letter-spacing: -1.2px;"
    >
      画廊
    </h1>
    <p class="text-body-md text-mute mb-6">浏览所有精彩画作</p>

    <FilterChips v-model="selectedFilter" :chips="filterChips" />

    <SkeletonGrid v-if="galleryStore.loading" :count="8" />

    <div v-else-if="galleryStore.error" class="text-center py-16">
      <p class="text-error mb-4">{{ galleryStore.error }}</p>
      <button class="btn-primary" @click="galleryStore.fetchGallery">重试</button>
    </div>

    <EmptyState v-else-if="filteredArtworks.length === 0" />

    <MasonryGrid v-else :artworks="filteredArtworks" @select="openLightbox" />

    <Lightbox
      v-model:visible="lightboxVisible"
      v-model:currentIndex="lightboxIndex"
      :artworks="filteredArtworks"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGalleryStore } from '../stores/gallery'
import FilterChips from '../components/FilterChips.vue'
import MasonryGrid from '../components/MasonryGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonGrid from '../components/SkeletonGrid.vue'
import Lightbox from '../components/Lightbox.vue'

const galleryStore = useGalleryStore()
const selectedFilter = ref('all')
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

const filterChips = [
  { label: '全部', value: 'all' },
  { label: '爸爸', value: '爸爸' },
  { label: '妈妈', value: '妈妈' },
  { label: '爷爷', value: '爷爷' },
  { label: '奶奶', value: '奶奶' }
]

const filteredArtworks = computed(() => {
  if (selectedFilter.value === 'all') return galleryStore.artworks
  return galleryStore.artworks.filter((a) => a.uploader === selectedFilter.value)
})

const openLightbox = (artwork: (typeof galleryStore.artworks)[0]) => {
  const index = filteredArtworks.value.findIndex((a) => a.key === artwork.key)
  if (index !== -1) {
    lightboxIndex.value = index
    lightboxVisible.value = true
  }
}

onMounted(() => {
  galleryStore.fetchGallery()
})
</script>
