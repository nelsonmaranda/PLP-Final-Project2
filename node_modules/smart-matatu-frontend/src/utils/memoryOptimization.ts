// Memory optimization utilities

export class MemoryManager {
  private static instance: MemoryManager
  private cache = new Map<string, any>()
  private maxCacheSize = 50 // Maximum number of items in cache
  private maxMemoryUsage = 50 * 1024 * 1024 // 50MB limit
  private currentMemoryUsage = 0

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  // Estimate memory usage of an object
  private estimateMemoryUsage(obj: any): number {
    if (obj === null || obj === undefined) return 0
    
    if (typeof obj === 'string') return obj.length * 2 // 2 bytes per character
    if (typeof obj === 'number') return 8
    if (typeof obj === 'boolean') return 4
    
    if (Array.isArray(obj)) {
      return obj.reduce((total, item) => total + this.estimateMemoryUsage(item), 0)
    }
    
    if (typeof obj === 'object') {
      let total = 0
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          total += key.length * 2 // Key size
          total += this.estimateMemoryUsage(obj[key])
        }
      }
      return total
    }
    
    return 0
  }

  // Add item to cache with memory management
  set(key: string, value: any): void {
    const memoryUsage = this.estimateMemoryUsage(value)
    
    // Check if adding this item would exceed memory limit
    if (this.currentMemoryUsage + memoryUsage > this.maxMemoryUsage) {
      this.cleanup()
    }
    
    // Remove existing item if it exists
    if (this.cache.has(key)) {
      this.remove(key)
    }
    
    // Add new item
    this.cache.set(key, {
      value,
      memoryUsage,
      timestamp: Date.now()
    })
    
    this.currentMemoryUsage += memoryUsage
    
    // Enforce max cache size
    if (this.cache.size > this.maxCacheSize) {
      this.evictOldest()
    }
  }

  // Get item from cache
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (item) {
      // Update access time
      item.timestamp = Date.now()
      return item.value
    }
    return null
  }

  // Remove item from cache
  remove(key: string): void {
    const item = this.cache.get(key)
    if (item) {
      this.currentMemoryUsage -= item.memoryUsage
      this.cache.delete(key)
    }
  }

  // Clean up cache by removing oldest items
  private cleanup(): void {
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => a.timestamp - b.timestamp)

    // Remove oldest 25% of items
    const itemsToRemove = Math.ceil(items.length * 0.25)
    for (let i = 0; i < itemsToRemove; i++) {
      this.remove(items[i].key)
    }
  }

  // Evict oldest item
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.remove(oldestKey)
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.currentMemoryUsage = 0
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      memoryUsage: this.currentMemoryUsage,
      maxMemoryUsage: this.maxMemoryUsage,
      memoryUsagePercent: (this.currentMemoryUsage / this.maxMemoryUsage) * 100
    }
  }
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memory leak detection
export function detectMemoryLeaks(): void {
  if (process.env.NODE_ENV === 'development') {
    const memoryManager = MemoryManager.getInstance()
    const stats = memoryManager.getStats()
    
    if (stats.memoryUsagePercent > 80) {
      console.warn('High memory usage detected:', stats)
    }
  }
}

// Cleanup utility for components
export function createCleanupManager() {
  const cleanupFunctions: (() => void)[] = []
  
  return {
    add: (fn: () => void) => {
      cleanupFunctions.push(fn)
    },
    cleanup: () => {
      cleanupFunctions.forEach(fn => fn())
      cleanupFunctions.length = 0
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTiming(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(label?: string): any {
    if (label) {
      const values = this.metrics.get(label) || []
      return {
        label,
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      }
    }
    
    const result: any = {}
    for (const [key, values] of this.metrics.entries()) {
      result[key] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      }
    }
    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}

export default {
  MemoryManager,
  debounce,
  throttle,
  detectMemoryLeaks,
  createCleanupManager,
  PerformanceMonitor
}
