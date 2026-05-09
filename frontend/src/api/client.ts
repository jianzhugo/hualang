import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const http = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

interface TokenResponse {
  url: string
  headers: Record<string, string>
  key: string
}

interface Artwork {
  key: string
  uploader: string
  title: string
  date: string
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
  presignedUrl: string,
  headers: Record<string, string>,
  blob: Blob
): Promise<void> => {
  await axios.put(presignedUrl, blob, {
    headers: {
      ...headers,
      'Content-Type': 'image/webp'
    },
    timeout: 60000
  })
}

export const registerArtwork = async (payload: {
  key: string
  uploader: string
  title?: string
  date?: string
}): Promise<void> => {
  await http.post('/api/register', payload)
}

export const fetchGalleryList = async (): Promise<Artwork[]> => {
  const { data } = await http.get<ListResponse>('/api/list')
  return data.artworks
}
