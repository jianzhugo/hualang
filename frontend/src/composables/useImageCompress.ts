import imageCompression from 'browser-image-compression'

interface CompressOptions {
  quality?: number
  maxWidthOrHeight?: number
  enableCompression: boolean
}

export async function compressImage(file: File, options: CompressOptions = { enableCompression: true }): Promise<Blob> {
  if (!options.enableCompression) {
    if (file.type === 'image/webp') return file
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => resolve(blob || file), 'image/webp')
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const fileSizeMB = file.size / (1024 * 1024)

  let quality: number
  let maxWidthOrHeight: number

  if (fileSizeMB > 10) {
    quality = 0.7
    maxWidthOrHeight = 1920
  } else if (fileSizeMB > 5) {
    quality = 0.75
    maxWidthOrHeight = 2560
  } else if (fileSizeMB > 2) {
    quality = 0.8
    maxWidthOrHeight = 3072
  } else if (fileSizeMB > 1) {
    quality = 0.85
    maxWidthOrHeight = 3840
  } else {
    quality = options.quality ?? 0.85
    maxWidthOrHeight = options.maxWidthOrHeight ?? 3840
  }

  const compressOptions = {
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: quality,
    preserveExif: true,
    alwaysKeepResolution: false
  }

  try {
    const compressedFile = await imageCompression(file, compressOptions)
    const saved = ((file.size - compressedFile.size) / file.size * 100).toFixed(1)
    console.log(`Compression: ${fileSizeMB.toFixed(1)}MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(1)}MB (saved ${saved}%)`)
    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    return file
  }
}
