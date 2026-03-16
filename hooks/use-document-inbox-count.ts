'use client'

import { useCallback } from 'react'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'

/**
 * Hook that fetches pending document inbox count for sidebar badge.
 * Uses sessionStorage cache for instant display, polls every 60s.
 */
export function useDocumentInboxCount(): number {
  const fetcher = useCallback(async () => {
    const res = await fetch('/api/accountant/inbox/count')
    if (!res.ok) throw new Error('fetch failed')
    return await res.json() as { count: number }
  }, [])

  const { data } = useCachedFetch('document-inbox-count', fetcher, { pollInterval: 60_000 })
  return data?.count ?? 0
}
