import { useState, useEffect, useCallback, useRef } from 'react'

export interface PresenceUser {
  user_id: string
  user_name: string
  document_id: string | null
  page: string
  last_heartbeat: string
}

interface UseExtractionPresenceOptions {
  userId: string | null
  documentId?: string | null
  page?: string
  enabled?: boolean
}

export function useExtractionPresence(options: UseExtractionPresenceOptions) {
  const { userId, documentId, page = 'verify', enabled = true } = options
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([])
  const [lockConflict, setLockConflict] = useState<{ userId: string; userName: string } | null>(null)
  const documentIdRef = useRef(documentId)
  documentIdRef.current = documentId

  // Heartbeat POST — every 5s
  useEffect(() => {
    if (!enabled || !userId) return

    const sendHeartbeat = async () => {
      if (document.hidden) return
      try {
        const res = await fetch('/api/extraction/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: documentIdRef.current, page }),
        })
        const data = await res.json()
        if (data.conflict) {
          setLockConflict({ userId: data.locked_by, userName: data.locked_by_name })
        } else {
          setLockConflict(null)
        }
      } catch { /* silent */ }
    }

    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 5_000)
    return () => clearInterval(interval)
  }, [userId, documentId, page, enabled])

  // Presence GET — every 5s
  useEffect(() => {
    if (!enabled || !userId) return

    const fetchPresence = async () => {
      if (document.hidden) return
      try {
        const res = await fetch('/api/extraction/presence')
        const data = await res.json()
        setActiveUsers(data.users || [])
      } catch { /* silent */ }
    }

    fetchPresence()
    const interval = setInterval(fetchPresence, 5_000)
    return () => clearInterval(interval)
  }, [userId, enabled])

  // Cleanup on unmount / page leave
  useEffect(() => {
    if (!enabled || !userId) return

    const cleanup = () => {
      // sendBeacon doesn't support DELETE, use POST with _method hint
      // Fallback: fetch with keepalive
      fetch('/api/extraction/presence', {
        method: 'DELETE',
        keepalive: true,
      }).catch(() => {})
    }

    window.addEventListener('beforeunload', cleanup)
    return () => {
      window.removeEventListener('beforeunload', cleanup)
      cleanup()
    }
  }, [userId, enabled])

  // Derived: who else is looking at the same document
  const documentViewers = activeUsers.filter(
    u => u.document_id === documentId && u.user_id !== userId
  )

  // Derived: other users in extraction section
  const otherUsers = activeUsers.filter(u => u.user_id !== userId)

  return { activeUsers, otherUsers, documentViewers, lockConflict }
}
