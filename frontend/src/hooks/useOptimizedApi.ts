import { useState, useEffect, useCallback, useRef } from 'react'

interface UseOptimizedApiOptions {
  debounceMs?: number
  cacheTime?: number
  retryAttempts?: number
  retryDelay?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttl: number): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

const apiCache = new ApiCache()

export function useOptimizedApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseOptimizedApiOptions = {}
) {
  const {
    debounceMs = 300,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const debounceRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const cacheKey = JSON.stringify(dependencies)

  const executeApiCall = useCallback(async (isRetry = false) => {
    // Check cache first
    const cachedData = apiCache.get<T>(cacheKey)
    if (cachedData && !isRetry) {
      setData(cachedData)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)

      const result = await apiCall()
      
      // Cache the result
      apiCache.set(cacheKey, result, cacheTime)
      
      setData(result)
      setRetryCount(0)
    } catch (err) {
      const error = err as Error
      
      if (error.name === 'AbortError') {
        return // Request was cancelled
      }

      setError(error)

      // Retry logic
      if (retryCount < retryAttempts) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          executeApiCall(true)
        }, retryDelay * Math.pow(2, retryCount)) // Exponential backoff
      }
    } finally {
      setLoading(false)
    }
  }, [apiCall, cacheKey, cacheTime, retryAttempts, retryDelay, retryCount])

  const debouncedExecute = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      executeApiCall()
    }, debounceMs)
  }, [executeApiCall, debounceMs])

  useEffect(() => {
    debouncedExecute()

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [debouncedExecute])

  const refetch = useCallback(() => {
    apiCache.delete(cacheKey)
    executeApiCall()
  }, [cacheKey, executeApiCall])

  const clearCache = useCallback(() => {
    apiCache.clear()
  }, [])

  return {
    data,
    loading,
    error,
    retryCount,
    refetch,
    clearCache
  }
}

export default useOptimizedApi
