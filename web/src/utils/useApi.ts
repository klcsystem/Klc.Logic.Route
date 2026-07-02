import { useState, useEffect } from 'react'
import type { ApiResponse } from '../types'

interface UseApiResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(fetcher: () => Promise<ApiResponse<T>>, deps: unknown[] = []): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetcher()
      .then((res) => {
        if (cancelled) return
        if (res.success) {
          setData(res.data)
        } else {
          setError(res.message || 'Bir hata oluştu')
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.response?.data?.message || err?.message || 'Bir hata oluştu')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...deps])

  const refetch = () => setTrigger((t) => t + 1)

  return { data, isLoading, error, refetch }
}
