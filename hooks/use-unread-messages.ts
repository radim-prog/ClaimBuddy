'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

export function useUnreadMessages() {
  const { userId } = useAccountantUser()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/accountant/conversations?count_only=true', {
        headers: { 'x-user-id': userId },
      })
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.total_unread || 0)
    } catch {
      // silent
    }
  }, [userId])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 60_000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  return { unreadCount, refresh: fetchUnread }
}
