'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const CACHE_PREFIX = 'cache:'
const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * Read a cache entry from sessionStorage, respecting TTL.
 * Returns null if missing, expired, or on SSR.
 */
function readCache<T>(key: string, ttl: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > ttl) {
      // Expired — remove it
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

/**
 * Write a cache entry to sessionStorage with a timestamp.
 * Silently fails on quota exceeded or SSR.
 */
function writeCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() }
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
  } catch {
    // Quota exceeded or other storage error — ignore
  }
}

/**
 * Invalidate one or more cache keys from sessionStorage.
 * Pass a string to clear one key, an array to clear multiple,
 * or no argument to clear ALL cached fetch entries.
 *
 * Can be called outside of React components.
 */
export function invalidateCache(keys?: string | string[]): void {
  if (typeof window === 'undefined') return
  try {
    if (!keys) {
      // Clear all cache entries
      const toRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k?.startsWith(CACHE_PREFIX)) toRemove.push(k)
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k))
    } else {
      const arr = Array.isArray(keys) ? keys : [keys]
      arr.forEach((k) => sessionStorage.removeItem(`${CACHE_PREFIX}${k}`))
    }
  } catch {
    // Storage unavailable — ignore
  }
}

/**
 * SWR-like hook: returns cached data instantly, then refreshes in background.
 * Eliminates loading spinners on tab switches / return visits.
 *
 * Features:
 * - TTL-based expiration (default 5 min, configurable via `ttl` option in ms)
 * - SSR-safe (no window access during server render)
 * - Quota-exceeded safe (silently degrades to no-cache)
 * - Use `invalidateCache(key)` to programmatically bust the cache
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { pollInterval?: number; enabled?: boolean; ttl?: number }
) {
  const enabled = options?.enabled ?? true
  const pollInterval = options?.pollInterval ?? 0
  const ttl = options?.ttl ?? DEFAULT_TTL_MS

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const lastJsonRef = useRef<string>('')

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      const json = JSON.stringify(result)
      // Only update state if data actually changed — prevents unnecessary re-renders
      if (json !== lastJsonRef.current) {
        lastJsonRef.current = json
        setData(result)
        writeCache(key, result)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    if (!enabled) return

    // Apply cached data immediately on mount (avoids SSR/client hydration mismatch)
    const cached = readCache<T>(key, ttl)
    if (cached !== null) {
      const json = JSON.stringify(cached)
      lastJsonRef.current = json
      setData(cached)
      setLoading(false)
    }

    refresh()

    if (pollInterval > 0) {
      const interval = setInterval(() => {
        if (!document.hidden) refresh()
      }, pollInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, pollInterval, enabled, key, ttl])

  return { data, loading, refresh }
}
