<template>
  <div class="gallery-page">
    <section class="gallery-hero">
      <div class="gallery-hero-bg" />
      <div class="gallery-hero-overlay" />
      <div class="gallery-hero-content">
        <h1 class="gallery-hero-title">未来艺术家</h1>
      </div>
    </section>

    <main class="gallery-main page-container">
      <div class="gallery-toolbar">
      <div class="gallery-toolbar-left">
        <SortDropdown v-model="sortOrder" />
      </div>

      <div class="gallery-toolbar-center">
        <div class="gallery-chips">
          <button
            v-for="author in authors"
            :key="author"
            class="gallery-chip"
            :class="{ 'gallery-chip-active': selectedAuthors.includes(author) }"
            @click="toggleAuthor(author)"
          >
            {{ author }}
          </button>
        </div>
        <div class="gallery-chip-divider" />
        <div class="gallery-chips-wrapper" :class="{ 'gallery-chips-wrapper-collapsed': tagsCollapsed && visibleTags.length < allTags.length }">
          <div class="gallery-chips">
            <button
              v-for="tag in visibleTags"
              :key="tag"
              class="gallery-chip"
              :class="{ 'gallery-chip-active': selectedTags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
          <button
            v-if="visibleTags.length < allTags.length"
            class="gallery-chips-toggle"
            @click="tagsCollapsed = !tagsCollapsed"
          >
            <ChevronDown v-if="tagsCollapsed" class="gallery-chips-toggle-icon" />
            <ChevronUp v-else class="gallery-chips-toggle-icon" />
            <span>{{ tagsCollapsed ? `+${allTags.length - visibleTags.length}` : '收起' }}</span>
          </button>
        </div>
      </div>

      <div class="gallery-toolbar-right">
        <FilterButton
          v-model:isOpen="filterOpen"
          :uploadDateStart="uploadDateStart"
          :uploadDateEnd="uploadDateEnd"
          :createdDateStart="createdDateStart"
          :createdDateEnd="createdDateEnd"
          :selectedUploaders="selectedUploaders"
          :selectedTags="selectedTags"
        />
        <button class="btn-sync" :disabled="syncing" @click="handleSync">
          {{ syncing ? '同步中...' : '同步R2图片' }}
        </button>
      </div>
    </div>

    <FilterPanel
      :isOpen="filterOpen"
      v-model:uploadDateStart="uploadDateStart"
      v-model:uploadDateEnd="uploadDateEnd"
      v-model:createdDateStart="createdDateStart"
      v-model:createdDateEnd="createdDateEnd"
      v-model:selectedUploaders="selectedUploaders"
      v-model:selectedTags="selectedTags"
      :uploaders="uploaders"
      :tags="allTags"
    />

    <p v-if="syncMessage" class="text-body-sm text-mute mb-4">{{ syncMessage }}</p>

    <SkeletonGrid v-if="galleryStore.loading" :count="8" />

    <div v-else-if="galleryStore.error" class="text-center py-16">
      <p class="text-error mb-4">{{ galleryStore.error }}</p>
      <button class="btn-primary" @click="galleryStore.fetchGallery">重试</button>
    </div>

    <EmptyState v-else-if="sortedFilteredArtworks.length === 0" />

    <MasonryGrid v-else :artworks="sortedFilteredArtworks" @select="openLightbox" @edit="openEdit" @delete="handleDelete" />

    <Lightbox
      v-model:visible="lightboxVisible"
      v-model:currentIndex="lightboxIndex"
      :artworks="sortedFilteredArtworks"
      @edit="openEdit"
    />

    <ArtworkEditDialog
      v-model:visible="editDialogVisible"
      :artwork="editingArtwork"
      @save="handleSave"
    />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGalleryStore } from '../stores/gallery'
import type { ArtworkItem } from '../stores/gallery'
import MasonryGrid from '../components/MasonryGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonGrid from '../components/SkeletonGrid.vue'
import Lightbox from '../components/Lightbox.vue'
import ArtworkEditDialog from '../components/ArtworkEditDialog.vue'
import SortDropdown from '../components/SortDropdown.vue'
import FilterButton from '../components/FilterButton.vue'
import FilterPanel from '../components/FilterPanel.vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

const MAX_VISIBLE_TAGS = 8

const galleryStore = useGalleryStore()
const sortOrder = ref('uploadDate-desc')
const uploadDateStart = ref('')
const uploadDateEnd = ref('')
const createdDateStart = ref('')
const createdDateEnd = ref('')
const selectedUploaders = ref<string[]>([])
const selectedTags = ref<string[]>([])
const selectedAuthors = ref<string[]>([])
const filterOpen = ref(false)
const tagsCollapsed = ref(true)
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)
const editDialogVisible = ref(false)
const editingArtwork = ref<ArtworkItem | null>(null)
const syncMessage = ref('')
const syncing = ref(false)

const authors = computed(() => {
  return [...new Set(galleryStore.artworks.map((a) => a.author).filter(Boolean))]
})

const allTags = computed(() => {
  return [...new Set(galleryStore.artworks.flatMap((a) => a.tags || []))]
})

const visibleTags = computed(() => {
  if (!tagsCollapsed.value) {
    return allTags.value
  }
  return allTags.value.slice(0, MAX_VISIBLE_TAGS)
})

const uploaders = computed(() => {
  return [...new Set(galleryStore.artworks.map((a) => a.uploader).filter(Boolean))]
})

const toggleAuthor = (author: string) => {
  if (selectedAuthors.value.includes(author)) {
    selectedAuthors.value = selectedAuthors.value.filter((a) => a !== author)
  } else {
    selectedAuthors.value.push(author)
  }
}

const toggleTag = (tag: string) => {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  } else {
    selectedTags.value.push(tag)
  }
}

const filteredArtworks = computed(() => {
  return galleryStore.artworks.filter((a) => {
    if (uploadDateStart.value && a.date < uploadDateStart.value) {
      return false
    }
    if (uploadDateEnd.value && a.date > uploadDateEnd.value) {
      return false
    }
    if (createdDateStart.value) {
      if (!a.createdDate || a.createdDate < createdDateStart.value) {
        return false
      }
    }
    if (createdDateEnd.value) {
      if (!a.createdDate || a.createdDate > createdDateEnd.value) {
        return false
      }
    }
    if (selectedUploaders.value.length > 0) {
      if (!a.uploader || !selectedUploaders.value.includes(a.uploader)) {
        return false
      }
    }
    if (selectedTags.value.length > 0) {
      if (!a.tags || !selectedTags.value.some((tag) => a.tags!.includes(tag))) {
        return false
      }
    }
    if (selectedAuthors.value.length > 0) {
      if (!a.author || !selectedAuthors.value.includes(a.author)) {
        return false
      }
    }
    return true
  })
})

const sortedFilteredArtworks = computed(() => {
  const artworks = [...filteredArtworks.value]
  switch (sortOrder.value) {
    case 'uploadDate-asc':
      return artworks.sort((a, b) => a.date.localeCompare(b.date))
    case 'uploadDate-desc':
      return artworks.sort((a, b) => b.date.localeCompare(a.date))
    case 'createdDate-asc':
      return artworks.sort((a, b) => {
        if (!a.createdDate && !b.createdDate) return 0
        if (!a.createdDate) return 1
        if (!b.createdDate) return -1
        return a.createdDate!.localeCompare(b.createdDate!)
      })
    case 'createdDate-desc':
      return artworks.sort((a, b) => {
        if (!a.createdDate && !b.createdDate) return 0
        if (!a.createdDate) return 1
        if (!b.createdDate) return -1
        return b.createdDate!.localeCompare(a.createdDate!)
      })
    default:
      return artworks
  }
})

const openLightbox = (artwork: (typeof galleryStore.artworks)[0]) => {
  const index = sortedFilteredArtworks.value.findIndex((a) => a.key === artwork.key)
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

const handleDelete = async (artwork: ArtworkItem) => {
  try {
    await galleryStore.removeArtwork(artwork.key)
    syncMessage.value = `已删除「${artwork.title}」`
  } catch {
    syncMessage.value = '删除失败，请重试'
  } finally {
    setTimeout(() => { syncMessage.value = '' }, 3000)
  }
}

const handleSync = async () => {
  syncing.value = true
  syncMessage.value = ''
  try {
    const count = await galleryStore.syncArtworks()
    if (count > 0) {
      syncMessage.value = `已同步 ${count} 张图片`
    } else {
      syncMessage.value = '没有需要同步的图片'
    }
  } catch {
    syncMessage.value = '同步失败，请重试'
  } finally {
    syncing.value = false
    setTimeout(() => { syncMessage.value = '' }, 3000)
  }
}

onMounted(() => {
  galleryStore.fetchGallery()
})
</script>
