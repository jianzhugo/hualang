import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<Blob> {
  const options = {
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
    preserveExif: true
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    return file
  }
}
