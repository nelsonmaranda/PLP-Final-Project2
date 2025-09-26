import { useState, useEffect, useCallback } from 'react'

interface SWROptions {
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  refreshInterval?: number
  retryCount?: number
  retryDelay?: number
  onError?: (error: Error) => void
}

interface SWRResponse<T> {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  isValidating: boolean
  mutate: () => Promise<void>
}

export function useSWR<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: SWROptions = {}
): SWRResponse<T> {
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    refreshInterval = 0,
    retryCount = 3,
    retryDelay = 1000,
    onError
  } = options

  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const fetchData = useCallback(async (isRetry = false) => {
    if (!key) return

    if (!isRetry) {
      setIsLoading(true)
    }
    setIsValidating(true)
    setError(undefined)

    let attempts = 0
    const maxAttempts = retryCount + 1

    while (attempts < maxAttempts) {
      try {
        const result = await fetcher()
        setData(result)
        setError(undefined)
        break
      } catch (err) {
        attempts++
        const error = err instanceof Error ? err : new Error('Unknown error')
        
        if (attempts >= maxAttempts) {
          setError(error)
          onError?.(error)
        } else {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempts - 1)))
        }
      }
    }

    setIsLoading(false)
    setIsValidating(false)
  }, [key, fetcher, retryCount, retryDelay, onError])

  const mutate = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchData(true)
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return

    const handleFocus = () => {
      fetchData(true)
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchData, revalidateOnFocus])

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return

    const handleOnline = () => {
      fetchData(true)
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [fetchData, revalidateOnReconnect])

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  }
}
