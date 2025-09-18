import { useState, useEffect, useCallback } from 'react'
import apiService from '../services/api'
import { LoadingState } from '../types'

interface UseApiOptions {
  immediate?: boolean
  dependencies?: any[]
}

interface UseApiResult<T> extends LoadingState {
  data: T | null
  refetch: () => Promise<void>
  setData: (data: T | null) => void
}

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { immediate = true, dependencies = [] } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const executeApiCall = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      const result = await apiCall()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [apiCall])

  useEffect(() => {
    if (immediate) {
      executeApiCall()
    }
  }, [immediate, executeApiCall, ...dependencies])

  return {
    data,
    isLoading,
    error,
    refetch: executeApiCall,
    setData,
  }
}

// Hook for routes
export function useRoutes() {
  return useApi(() => apiService.getRoutes().then(response => response.data || []))
}

// Hook for single route
export function useRoute(id: string) {
  return useApi(
    () => apiService.getRoute(id).then(response => response.data),
    { dependencies: [id] }
  )
}

// Hook for reports
export function useReports(page = 1, limit = 10) {
  return useApi(
    () => apiService.getReports(page, limit).then(response => response.data),
    { dependencies: [page, limit] }
  )
}

// Hook for reports by route
export function useReportsByRoute(routeId: string) {
  return useApi(
    () => apiService.getReportsByRoute(routeId).then(response => response.data || []),
    { dependencies: [routeId] }
  )
}

// Hook for scores
export function useScores() {
  return useApi(() => apiService.getScores().then(response => response.data || []))
}

// Hook for scores by route
export function useScoresByRoute(routeId: string) {
  return useApi(
    () => apiService.getScoresByRoute(routeId).then(response => response.data || []),
    { dependencies: [routeId] }
  )
}

// Hook for analytics
export function useAnalytics() {
  return useApi(() => apiService.getAnalytics().then(response => response.data))
}

// Hook for users
export function useUsers(page = 1, limit = 10) {
  return useApi(
    () => apiService.getUsers(page, limit).then(response => response.data),
    { dependencies: [page, limit] }
  )
}

// Hook for current user
export function useCurrentUser() {
  const [user, setUser] = useState(apiService.getCurrentUser())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      const currentUser = apiService.getCurrentUser()
      setUser(currentUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  return {
    user,
    isLoading,
    error,
    refreshUser,
  }
}

// Hook for authentication
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!apiService.getCurrentUser())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const login = useCallback(async (credentials: any) => {
    try {
      setIsLoading(true)
      setError(undefined)
      const response = await apiService.login(credentials)
      if (response.success) {
        setIsAuthenticated(true)
      }
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (userData: any) => {
    try {
      setIsLoading(true)
      setError(undefined)
      const response = await apiService.signup(userData)
      if (response.success) {
        setIsAuthenticated(true)
      }
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    apiService.logout()
    setIsAuthenticated(false)
  }, [])

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
  }
}

// Hook for form submission
export function useFormSubmit<T>(
  submitFn: (data: T) => Promise<any>,
  onSuccess?: (result: any) => void,
  onError?: (error: string) => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const submit = useCallback(async (data: T) => {
    try {
      setIsSubmitting(true)
      setError(undefined)
      const result = await submitFn(data)
      onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [submitFn, onSuccess, onError])

  return {
    submit,
    isSubmitting,
    error,
  }
}

// Hook for search
export function useSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    try {
      setIsSearching(true)
      setError(undefined)
      const searchResults = await searchFn(searchQuery)
      setResults(searchResults)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }, [searchFn])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [query, search, debounceMs])

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearResults: () => setResults([]),
  }
}
