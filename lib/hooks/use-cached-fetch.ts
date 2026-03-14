'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * SWR-like hook: returns cached data instantly, then refreshes in background.
 * Eliminates loading spinners on tab switches / return visits.
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { pollInterval?: number; enabled?: boolean }
) {
  const enabled = options?.enabled ?? true
  const pollInterval = options?.pollInterval ?? 0

  const [data, setData] = useState<T | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const cached = sessionStorage.getItem(`cache:${key}`)
      if (cached) return JSON.parse(cached) as T
    } catch {}
    return null
  })
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      return !sessionStorage.getItem(`cache:${key}`)
    } catch {}
    return true
  })

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      setData(result)
      try {
        sessionStorage.setItem(`cache:${key}`, JSON.stringify(result))
      } catch {}
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    if (!enabled) return

    refresh()

    if (pollInterval > 0) {
      const interval = setInterval(() => {
        if (!document.hidden) refresh()
      }, pollInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, pollInterval, enabled])

  return { data, loading, refresh }
}
