import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGalleryList } from '../api/client'

export interface ArtworkItem {
  key: string
  uploader: string
  title: string
  date: string
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

  return { artworks, loading, error, fetchGallery, addArtwork }
})
