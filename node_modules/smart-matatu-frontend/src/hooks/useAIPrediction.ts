import { useState, useCallback } from 'react'
import apiService from '../services/api'

export function useAIPrediction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ prediction: number; label: string; confidence: number } | null>(null)

  const predict = useCallback(async (routeId: string, features: Record<string, number>) => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiService.predict(routeId, features)
      if (res.success && res.data) {
        setResult(res.data)
      }
    } catch (e: any) {
      setError(e.message || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, result, predict }
}

export default useAIPrediction

