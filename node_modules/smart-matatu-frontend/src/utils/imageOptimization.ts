// Image optimization utilities

export interface ImageOptimizationOptions {
  quality?: number
  width?: number
  height?: number
  format?: 'webp' | 'jpeg' | 'png'
  lazy?: boolean
}

export function getOptimizedImageUrl(
  originalUrl: string,
  _options: ImageOptimizationOptions = {}
): string {
  // For now, return the original URL
  // In a real app, you'd integrate with an image optimization service
  // like Cloudinary, ImageKit, or Next.js Image Optimization
  return originalUrl
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage))
}

// Lazy loading utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Image compression utility (client-side)
export function compressImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const { quality = 0.8, width, height } = options
      
      // Calculate dimensions
      let newWidth = width || img.width
      let newHeight = height || img.height
      
      // Maintain aspect ratio
      if (width && !height) {
        newHeight = (img.height * width) / img.width
      } else if (height && !width) {
        newWidth = (img.width * height) / img.height
      }

      canvas.width = newWidth
      canvas.height = newHeight

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// WebP support detection
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

// Responsive image utility
export function getResponsiveImageSrc(
  baseUrl: string,
  sizes: { [key: string]: string }
): string {
  const mediaQueries = Object.keys(sizes)
    .map(size => `(max-width: ${size})`)
    .join(', ')

  return `url(${baseUrl}) ${mediaQueries}`
}

export default {
  getOptimizedImageUrl,
  preloadImage,
  preloadImages,
  createIntersectionObserver,
  compressImage,
  supportsWebP,
  getResponsiveImageSrc
}
