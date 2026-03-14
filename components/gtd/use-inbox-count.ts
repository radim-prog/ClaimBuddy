'use client'

import { useCallback } from 'react'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'

/**
 * Hook that fetches inbox (pending) task count from the API.
 * Uses sessionStorage cache for instant display, polls every 120s.
 */
export function useInboxCount(): number {
  const fetcher = useCallback(async () => {
    const res = await fetch('/api/tasks?status=pending&count_only=true')
    if (!res.ok) throw new Error('fetch failed')
    return await res.json() as { count: number }
  }, [])

  const { data } = useCachedFetch('inbox-count', fetcher, { pollInterval: 120_000 })
  return data?.count ?? 0
}
