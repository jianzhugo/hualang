import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const http = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

interface TokenResponse {
  url: string
  key: string
}

interface Artwork {
  key: string
  uploader: string
  author: string
  title: string
  date: string
  createdDate?: string
  tags?: string[]
  url?: string
}

interface ListResponse {
  artworks: Artwork[]
}

export const getToken = async (password: string): Promise<TokenResponse> => {
  const { data } = await http.post<TokenResponse>('/api/token', { password })
  return data
}

export const uploadFile = async (
  uploadUrl: string,
  blob: Blob
): Promise<void> => {
  await axios.put(uploadUrl, blob, {
    headers: { 'Content-Type': 'image/webp' },
    timeout: 60000
  })
}

export const registerArtwork = async (payload: {
  key: string
  uploader: string
  author: string
  title?: string
  date?: string
  createdDate?: string
  tags?: string[]
}): Promise<void> => {
  await http.post('/api/register', payload)
}

export const fetchGalleryList = async (): Promise<Artwork[]> => {
  const { data } = await http.get<ListResponse>('/api/list')
  return data.artworks
}

export const updateArtwork = async (payload: {
  key: string
  author?: string
  title?: string
  createdDate?: string
  tags?: string[]
}, password: string): Promise<void> => {
  await http.put('/api/artwork', payload, {
    headers: { Authorization: `Bearer ${password}` }
  })
}

export const syncR2 = async (password: string): Promise<{ synced: number }> => {
  const { data } = await http.post('/api/sync', null, {
    headers: { Authorization: `Bearer ${password}` }
  })
  return data
}

export const deleteArtwork = async (key: string, password: string): Promise<void> => {
  await http.delete('/api/artwork', {
    headers: { Authorization: `Bearer ${password}` },
    data: { key }
  })
}
