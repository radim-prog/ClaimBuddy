'use client'

import { useState, useEffect } from 'react'

/**
 * Hook that fetches inbox (pending) task count from the API.
 * Polls every 60 seconds to keep the badge updated.
 */
export function useInboxCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/tasks?status=pending&count_only=true')
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setCount(data.count || 0)
      } catch {
        // Silently ignore - badge is non-critical
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 60_000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return count
}
