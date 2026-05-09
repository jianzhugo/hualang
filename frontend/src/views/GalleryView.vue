<template>
  <main class="max-w-7xl mx-auto px-4 md:px-6 py-8">
    <div class="flex flex-wrap gap-4 mb-6">
      <div>
        <h2 class="text-body-sm font-semibold text-ink mb-2">按作者</h2>
        <FilterChips v-model="selectedAuthor" :chips="authorChips" />
      </div>

      <div>
        <h2 class="text-body-sm font-semibold text-ink mb-2">按创作日期</h2>
        <FilterChips v-model="selectedCreatedDate" :chips="createdDateChips" />
      </div>

      <div>
        <h2 class="text-body-sm font-semibold text-ink mb-2">按标签</h2>
        <FilterChips v-model="selectedTag" :chips="tagChips" />
      </div>
    </div>

    <SkeletonGrid v-if="galleryStore.loading" :count="8" />

    <div v-else-if="galleryStore.error" class="text-center py-16">
      <p class="text-error mb-4">{{ galleryStore.error }}</p>
      <button class="btn-primary" @click="galleryStore.fetchGallery">重试</button>
    </div>

    <EmptyState v-else-if="filteredArtworks.length === 0" />

    <MasonryGrid v-else :artworks="filteredArtworks" @select="openLightbox" @edit="openEdit" />

    <Lightbox
      v-model:visible="lightboxVisible"
      v-model:currentIndex="lightboxIndex"
      :artworks="filteredArtworks"
      @edit="openEdit"
    />

    <ArtworkEditDialog
      v-model:visible="editDialogVisible"
      :artwork="editingArtwork"
      @save="handleSave"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGalleryStore } from '../stores/gallery'
import type { ArtworkItem } from '../stores/gallery'
import FilterChips from '../components/FilterChips.vue'
import MasonryGrid from '../components/MasonryGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonGrid from '../components/SkeletonGrid.vue'
import Lightbox from '../components/Lightbox.vue'
import ArtworkEditDialog from '../components/ArtworkEditDialog.vue'

const galleryStore = useGalleryStore()
const selectedAuthor = ref('all')
const selectedCreatedDate = ref('all')
const selectedTag = ref('all')
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)
const editDialogVisible = ref(false)
const editingArtwork = ref<ArtworkItem | null>(null)

const authorChips = computed(() => {
  const authors = [...new Set(galleryStore.artworks.map((a) => a.author))]
  return [
    { label: '全部', value: 'all' },
    ...authors.map((a) => ({ label: a, value: a }))
  ]
})

const createdDateChips = computed(() => {
  const dates = [...new Set(galleryStore.artworks.flatMap((a) => a.createdDate ? [a.createdDate] : []))].sort((a, b) => b.localeCompare(a))
  if (dates.length === 0) {
    return [{ label: '无创作日期', value: 'none' }]
  }
  const dateLabels: Record<string, string> = {}
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  dates.forEach((d) => {
    if (d === today) {
      dateLabels[d] = '今天'
    } else if (d === yesterday) {
      dateLabels[d] = '昨天'
    } else {
      dateLabels[d] = d
    }
  })

  return [
    { label: '全部', value: 'all' },
    ...dates.map((d) => ({ label: dateLabels[d], value: d }))
  ]
})

const tagChips = computed(() => {
  const tags = [...new Set(galleryStore.artworks.flatMap((a) => a.tags || []))]
  if (tags.length === 0) {
    return [{ label: '无标签', value: 'none' }]
  }
  return [
    { label: '全部', value: 'all' },
    ...tags.map((t) => ({ label: t, value: t }))
  ]
})

const filteredArtworks = computed(() => {
  return galleryStore.artworks.filter((a) => {
    if (selectedAuthor.value !== 'all' && a.author !== selectedAuthor.value) {
      return false
    }
    if (selectedCreatedDate.value !== 'all') {
      if (selectedCreatedDate.value === 'none') {
        if (a.createdDate) return false
      } else {
        if (!a.createdDate || a.createdDate !== selectedCreatedDate.value) return false
      }
    }
    if (selectedTag.value !== 'all') {
      if (selectedTag.value === 'none') {
        if (a.tags && a.tags.length > 0) return false
      } else {
        if (!a.tags || !a.tags.includes(selectedTag.value)) return false
      }
    }
    return true
  })
})

const openLightbox = (artwork: (typeof galleryStore.artworks)[0]) => {
  const index = filteredArtworks.value.findIndex((a) => a.key === artwork.key)
  if (index !== -1) {
    lightboxIndex.value = index
    lightboxVisible.value = true
  }
}

const openEdit = (artwork: (typeof galleryStore.artworks)[0]) => {
  editingArtwork.value = artwork
  editDialogVisible.value = true
}

const handleSave = async (data: { key: string; title: string; author: string; createdDate: string; tags: string[] }) => {
  await galleryStore.updateArtworkData(data.key, {
    title: data.title,
    author: data.author,
    createdDate: data.createdDate || undefined,
    tags: data.tags
  })
}

onMounted(() => {
  galleryStore.fetchGallery()
})
</script>
