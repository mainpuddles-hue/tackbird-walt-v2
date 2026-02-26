/**
 * Client-side image optimization using Canvas API.
 *
 * Resizes and compresses images before upload to reduce bandwidth
 * and storage costs. Runs entirely in the browser.
 */

interface OptimizeOptions {
  /** Maximum width or height in pixels (default: 1200) */
  maxSize?: number
  /** JPEG quality 0–1 (default: 0.85) */
  quality?: number
  /** Output MIME type (default: image/jpeg) */
  type?: string
}

const DEFAULT_OPTIONS: Required<OptimizeOptions> = {
  maxSize: 1200,
  quality: 0.85,
  type: 'image/jpeg',
}

/**
 * Resize and compress an image file using Canvas.
 * Returns a new File object with the optimized image.
 *
 * - Maintains aspect ratio
 * - Skips optimization if image is already smaller than maxSize
 * - Converts to JPEG for smaller file size (unless PNG transparency is needed)
 */
export async function optimizeImage(
  file: File,
  options?: OptimizeOptions
): Promise<File> {
  const { maxSize, quality, type } = { ...DEFAULT_OPTIONS, ...options }

  // Skip non-image files
  if (!file.type.startsWith('image/')) return file

  // Skip SVGs (can't canvas-optimize)
  if (file.type === 'image/svg+xml') return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Skip if already small enough and file is under 500KB
      if (width <= maxSize && height <= maxSize && file.size < 500 * 1024) {
        resolve(file)
        return
      }

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file) // Fallback: return original
        return
      }

      // White background for JPEG (no transparency)
      if (type === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }

          // If optimized is larger than original, use original
          if (blob.size >= file.size) {
            resolve(file)
            return
          }

          const ext = type === 'image/jpeg' ? '.jpg' : '.png'
          const name = file.name.replace(/\.[^.]+$/, '') + ext
          resolve(new File([blob], name, { type }))
        },
        type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/** Preset for post images (1200px, high quality) */
export function optimizePostImage(file: File): Promise<File> {
  return optimizeImage(file, { maxSize: 1200, quality: 0.85 })
}

/** Preset for avatar images (400px, good quality) */
export function optimizeAvatar(file: File): Promise<File> {
  return optimizeImage(file, { maxSize: 400, quality: 0.9 })
}

/** Preset for message images (800px, moderate quality) */
export function optimizeMessageImage(file: File): Promise<File> {
  return optimizeImage(file, { maxSize: 800, quality: 0.8 })
}
