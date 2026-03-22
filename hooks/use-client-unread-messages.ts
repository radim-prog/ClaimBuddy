'use client'

import { useCallback } from 'react'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import { useClientUser } from '@/lib/contexts/client-user-context'

interface UnreadData {
  total: number
  per_company: Record<string, number>
}

export function useClientUnreadMessages() {
  const { hiddenCompanyIds } = useClientUser()

  const fetcher = useCallback(async () => {
    const res = await fetch('/api/client/unread-count')
    if (!res.ok) throw new Error('fetch failed')
    return await res.json() as UnreadData
  }, [])

  const { data, refresh } = useCachedFetch(
    'client-unread',
    fetcher,
    { pollInterval: 60_000 }
  )

  // Filter out hidden companies
  const perCompany: Record<string, number> = {}
  let totalUnread = 0
  if (data?.per_company) {
    for (const [companyId, count] of Object.entries(data.per_company)) {
      if (!hiddenCompanyIds.has(companyId)) {
        perCompany[companyId] = count
        totalUnread += count
      }
    }
  }

  return {
    totalUnread,
    perCompany,
    refresh,
  }
}
