<template>
  <div class="gallery-page">
    <section class="gallery-hero">
      <div class="gallery-hero-bg" />
      <div class="gallery-hero-overlay" />
      <div class="gallery-hero-content">
        <h1 class="gallery-hero-title">稚笔生花</h1>
        <p class="gallery-hero-subtitle">小小的手，画出大大的世界</p>
      </div>
    </section>

    <main class="gallery-main page-container">
      <div class="gallery-toolbar">
      <div class="gallery-toolbar-left">
        <SortDropdown v-model="sortOrder" />
      </div>

      <div ref="toolbarRef" class="gallery-toolbar-center">
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
        <div class="gallery-chips-wrapper">
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
          <div v-if="hiddenTags.length > 0" class="gallery-chips-dropdown-wrap">
            <button
              class="gallery-chips-toggle"
              @click.stop="showTagsDropdown = !showTagsDropdown"
            >
              <ChevronDown class="gallery-chips-toggle-icon" :class="{ 'gallery-chips-toggle-icon-open': showTagsDropdown }" />
              <span>+{{ hiddenTags.length }}</span>
            </button>
            <div v-if="showTagsDropdown" class="gallery-chips-dropdown">
              <button
                v-for="tag in hiddenTags"
                :key="tag"
                class="gallery-chip"
                :class="{ 'gallery-chip-active': selectedTags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
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
      :key="filterOpen ? 1 : 0"
      :isOpen="filterOpen"
      @close="filterOpen = false"
      v-model:uploadDateStart="uploadDateStart"
      v-model:uploadDateEnd="uploadDateEnd"
      v-model:createdDateStart="createdDateStart"
      v-model:createdDateEnd="createdDateEnd"
      v-model:selectedUploaders="selectedUploaders"
      v-model:selectedAuthors="selectedAuthors"
      v-model:selectedTags="selectedTags"
      :uploaders="uploaders"
      :authors="authors"
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

    <!-- 编辑密码验证 -->
    <Teleport to="body">
      <Transition name="auth-fade">
        <div v-if="showEditAuth" class="auth-overlay" @click.self="showEditAuth = false">
          <div class="auth-modal">
            <p class="auth-title">验证后才可编辑</p>
            <div class="auth-input-group">
              <input
                ref="authInputRef"
                v-model="editPassword"
                type="password"
                placeholder="请输入密码"
                class="auth-input"
                @keyup.enter="verifyEditPassword"
              />
            </div>
            <p v-if="editPasswordError" class="auth-error">{{ editPasswordError }}</p>
            <div class="auth-actions">
              <button class="auth-btn auth-btn-cancel" @click="showEditAuth = false">取消</button>
              <button class="auth-btn auth-btn-confirm" @click="verifyEditPassword">确定</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
import { ChevronDown } from 'lucide-vue-next'

const maxVisibleTags = ref(99)

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
const showTagsDropdown = ref(false)
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)
const editDialogVisible = ref(false)
const editingArtwork = ref<ArtworkItem | null>(null)
const syncMessage = ref('')
const syncing = ref(false)
const showEditAuth = ref(false)
const editPassword = ref('')
const editPasswordError = ref('')
const pendingEditArtwork = ref<ArtworkItem | null>(null)
const toolbarRef = ref<HTMLElement>()
let resizeObserver: ResizeObserver | null = null

const recalcVisibleTags = () => {
  if (!toolbarRef.value) return

  nextTick(() => {
    const toolbar = toolbarRef.value!
    const toolbarWidth = toolbar.clientWidth

    const authorSection = toolbar.querySelector<HTMLElement>('.gallery-chips:first-child')
    const authorWidth = authorSection?.scrollWidth || 0

    const divider = toolbar.querySelector<HTMLElement>('.gallery-chip-divider')
    const dividerWidth = divider ? divider.offsetWidth + 16 : 17

    const toggleReserve = allTags.value.length > 3 ? 56 : 0

    const maxAvail = toolbarWidth - authorWidth - dividerWidth - toggleReserve - 24
    if (maxAvail < 0) {
      maxVisibleTags.value = Math.max(2, Math.floor(toolbarWidth / 80))
      return
    }

    const chips = toolbar.querySelectorAll<HTMLElement>('.gallery-chips-wrapper .gallery-chips .gallery-chip')
    if (chips.length === 0) return

    let used = 0
    let count = 0
    const gap = 8

    for (const chip of chips) {
      const w = chip.offsetWidth + (count > 0 ? gap : 0)
      if (used + w > maxAvail) break
      used += w
      count++
    }

    if (count >= allTags.value.length) {
      maxVisibleTags.value = allTags.value.length
    } else {
      maxVisibleTags.value = Math.max(2, count)
    }
  })
}

const authors = computed(() => {
  return [...new Set(galleryStore.artworks.map((a) => a.author).filter(Boolean))]
})

const allTags = computed(() => {
  return [...new Set(galleryStore.artworks.flatMap((a) => a.tags || []))]
})

const visibleTags = computed(() => {
  return allTags.value.slice(0, maxVisibleTags.value)
})

const hiddenTags = computed(() => {
  return allTags.value.slice(maxVisibleTags.value)
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
  const stored = sessionStorage.getItem('gallery_auth')
  if (stored) {
    editingArtwork.value = artwork
    editDialogVisible.value = true
  } else {
    pendingEditArtwork.value = artwork
    editPassword.value = ''
    editPasswordError.value = ''
    showEditAuth.value = true
  }
}

const verifyEditPassword = async () => {
  if (!editPassword.value) return
  editPasswordError.value = ''
  try {
    const { getToken } = await import('../api/client')
    await getToken(editPassword.value)
    sessionStorage.setItem('gallery_auth', editPassword.value)
    showEditAuth.value = false
    if (pendingEditArtwork.value) {
      editingArtwork.value = pendingEditArtwork.value
      editDialogVisible.value = true
    }
  } catch {
    editPasswordError.value = '密码不正确'
  }
}

const handleSave = async (data: { key: string; title: string; uploader: string; author: string; createdDate: string; tags: string[] }) => {
  await galleryStore.updateArtworkData(data.key, {
    title: data.title,
    uploader: data.uploader,
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

const closeTagsDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.gallery-chips-dropdown-wrap')) {
    showTagsDropdown.value = false
  }
}

onMounted(() => {
  galleryStore.fetchGallery()
  document.addEventListener('click', closeTagsDropdown)
  recalcVisibleTags()
  if (toolbarRef.value) {
    resizeObserver = new ResizeObserver(() => recalcVisibleTags())
    resizeObserver.observe(toolbarRef.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeTagsDropdown)
  resizeObserver?.disconnect()
})
</script>
