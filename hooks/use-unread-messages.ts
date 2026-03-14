'use client'

import { useCallback } from 'react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'

export function useUnreadMessages() {
  const { userId } = useAccountantUser()

  const fetcher = useCallback(async () => {
    if (!userId) return { total_unread: 0, needs_response: 0 }
    const res = await fetch('/api/accountant/conversations?count_only=true', {
      headers: { 'x-user-id': userId },
    })
    if (!res.ok) throw new Error('fetch failed')
    return await res.json() as { total_unread: number; needs_response: number }
  }, [userId])

  const { data, refresh } = useCachedFetch(
    `unread-${userId}`,
    fetcher,
    { pollInterval: 120_000, enabled: !!userId }
  )

  return {
    unreadCount: data?.total_unread ?? 0,
    needsResponseCount: data?.needs_response ?? 0,
    refresh,
  }
}
