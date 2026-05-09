import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGalleryList, updateArtwork, syncR2, deleteArtwork } from '../api/client'

export interface ArtworkItem {
  key: string
  uploader: string
  author: string
  title: string
  date: string
  createdDate?: string
  tags?: string[]
  url?: string
}

export const useGalleryStore = defineStore('gallery', () => {
  const artworks = ref<ArtworkItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchGallery = async () => {
    loading.value = true
    error.value = null
    try {
      artworks.value = await fetchGalleryList()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err?.response?.data?.message || err?.message || 'Failed to load gallery'
    } finally {
      loading.value = false
    }
  }

  const addArtwork = (artwork: ArtworkItem) => {
    artworks.value.unshift(artwork)
  }

  const updateArtworkData = async (key: string, updates: { author?: string; title?: string; createdDate?: string; tags?: string[] }) => {
    const password = sessionStorage.getItem('gallery_auth') || ''
    await updateArtwork({ key, ...updates }, password)
    const idx = artworks.value.findIndex((a) => a.key === key)
    if (idx !== -1) {
      artworks.value[idx] = { ...artworks.value[idx], ...updates }
    }
  }

  const removeArtwork = async (key: string) => {
    const password = sessionStorage.getItem('gallery_auth') || ''
    await deleteArtwork(key, password)
    artworks.value = artworks.value.filter((a) => a.key !== key)
  }

  const syncArtworks = async (): Promise<number> => {
    const password = sessionStorage.getItem('gallery_auth') || ''
    const result = await syncR2(password)
    await fetchGallery()
    return result.synced
  }

  return { artworks, loading, error, fetchGallery, addArtwork, updateArtworkData, removeArtwork, syncArtworks }
})
