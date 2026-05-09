import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getToken, uploadFile, registerArtwork } from '../api/client'

interface UploadItem {
  id: string
  file: File
  compressedBlob?: Blob
  status: 'pending' | 'compressing' | 'uploading' | 'registering' | 'done' | 'error'
  progress: number
  errorMessage?: string
  retryCount: number
}

export const useUploadStore = defineStore('upload', () => {
  const password = ref('')
  const isAuthenticated = ref(false)
  const selectedUploader = ref('')
  const selectedAuthor = ref('')
  const createdDate = ref('')
  const selectedTags = ref<string[]>([])
  const uploadQueue = ref<UploadItem[]>([])
  const isUploading = ref(false)

  const checkAuth = () => {
    const stored = sessionStorage.getItem('gallery_auth')
    if (stored) {
      isAuthenticated.value = true
      password.value = stored
    }
    return isAuthenticated.value
  }

  const verifyPassword = async (pwd: string): Promise<boolean> => {
    try {
      await getToken(pwd)
      isAuthenticated.value = true
      password.value = pwd
      sessionStorage.setItem('gallery_auth', pwd)
      return true
    } catch {
      return false
    }
  }

  const addFiles = (files: File[], uploader: string) => {
    selectedUploader.value = uploader
    const newItems: UploadItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      status: 'pending',
      progress: 0,
      retryCount: 0
    }))
    uploadQueue.value = [...uploadQueue.value, ...newItems]
  }

  const updateItem = (id: string, updates: Partial<UploadItem>) => {
    const idx = uploadQueue.value.findIndex((item) => item.id === id)
    if (idx !== -1) {
      uploadQueue.value[idx] = { ...uploadQueue.value[idx], ...updates }
    }
  }

  const processItem = async (item: UploadItem): Promise<void> => {
    try {
      updateItem(item.id, { status: 'compressing', progress: 0, errorMessage: undefined })
      
      // Compression step - using browser-image-compression
      let blob: Blob = item.file
      if (item.compressedBlob) {
        blob = item.compressedBlob
      }

      updateItem(item.id, { status: 'uploading', progress: 10 })

      const tokenResult = await getToken(password.value)
      
      updateItem(item.id, { progress: 30 })

      await uploadFile(tokenResult.url, tokenResult.headers, blob)
      
      updateItem(item.id, { status: 'registering', progress: 80 })

      await registerArtwork({
        key: tokenResult.key,
        uploader: selectedUploader.value,
        author: selectedAuthor.value,
        title: item.file.name.replace(/\.[^.]+$/, ''),
        date: new Date().toISOString().split('T')[0],
        createdDate: createdDate.value || undefined,
        tags: selectedTags.value
      })

      updateItem(item.id, { status: 'done', progress: 100 })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = err?.response?.data?.message || err?.message || 'Upload failed'
      
      if (item.retryCount < 1) {
        updateItem(item.id, {
          status: 'pending',
          progress: 0,
          retryCount: item.retryCount + 1,
          errorMessage: undefined
        })
      } else {
        updateItem(item.id, { status: 'error', progress: 0, errorMessage: errorMsg })
      }
    }
  }

  const processQueue = async (onProgress?: (item: UploadItem) => void) => {
    isUploading.value = true
    const CONCURRENCY = 3

    const processNext = async (): Promise<void> => {
      const pending = uploadQueue.value.filter(
        (item) => item.status === 'pending' && item.retryCount <= 1
      )
      if (pending.length === 0) return

      const batch = pending.slice(0, CONCURRENCY)
      await Promise.all(
        batch.map(async (item) => {
          await processItem(item)
          onProgress?.(item)
        })
      )
      await processNext()
    }

    await processNext()
    isUploading.value = false
  }

  const clearQueue = () => {
    uploadQueue.value = []
  }

  const removeItem = (id: string) => {
    uploadQueue.value = uploadQueue.value.filter((item) => item.id !== id)
  }

  return {
    password,
    isAuthenticated,
    selectedUploader,
    selectedAuthor,
    createdDate,
    selectedTags,
    uploadQueue,
    isUploading,
    checkAuth,
    verifyPassword,
    addFiles,
    processQueue,
    clearQueue,
    removeItem,
    updateItem
  }
})
