'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DriveSyncState, SyncResult } from '@/lib/types/drive'

type SyncStatusProps = {
  companyId: string
  onSyncComplete?: () => void
}

// --- Helpers ---

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'nikdy'
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'prave ted'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `pred ${diffMin} min`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `pred ${diffHour} hod`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `pred ${diffDay} dny`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `pred ${diffMonth} mes.`
  return `pred ${Math.floor(diffMonth / 12)} r.`
}

type StatusConfig = {
  dot: string
  label: string
}

function getStatusConfig(
  status: DriveSyncState['sync_status'] | null
): StatusConfig {
  switch (status) {
    case 'synced':
      return { dot: 'bg-green-500', label: 'Synchronizovano' }
    case 'syncing':
      return { dot: 'bg-yellow-500 animate-pulse', label: 'Synchronizuji...' }
    case 'error':
      return { dot: 'bg-red-500', label: 'Chyba synchronizace' }
    case 'never_synced':
    default:
      return { dot: 'bg-gray-400', label: 'Nesynchronizovano' }
  }
}

export function SyncStatus({ companyId, onSyncComplete }: SyncStatusProps) {
  const [syncState, setSyncState] = useState<DriveSyncState | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch current sync state
  const fetchSyncState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/drive/sync?companyId=${encodeURIComponent(companyId)}`
      )
      if (!res.ok) return
      const data = await res.json()
      setSyncState(data)
    } catch {
      // Silently fail on fetch - not critical
    }
  }, [companyId])

  useEffect(() => {
    fetchSyncState()
  }, [fetchSyncState])

  // Trigger sync
  const handleSync = async () => {
    setIsSyncing(true)
    setLastResult(null)
    setError(null)

    try {
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          mode: 'incremental',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Chyba synchronizace' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const result: SyncResult = await res.json()
      setLastResult(result)

      // Refresh sync state
      await fetchSyncState()

      onSyncComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznama chyba')
    } finally {
      setIsSyncing(false)
    }
  }

  const effectiveStatus = isSyncing
    ? 'syncing'
    : syncState?.sync_status ?? 'never_synced'
  const config = getStatusConfig(effectiveStatus)

  const lastSyncAt: string | null =
    syncState?.last_incremental_sync_at ?? syncState?.last_full_sync_at ?? null

  return (
    <div className="inline-flex items-center gap-2">
      {/* Status chip */}
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
          'border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-900',
          'text-xs text-gray-600 dark:text-gray-400'
        )}
      >
        <span
          className={cn('inline-block h-2 w-2 rounded-full shrink-0', config.dot)}
          aria-hidden="true"
        />
        <span>{formatRelativeTime(lastSyncAt)}</span>
      </div>

      {/* Sync button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleSync}
        disabled={isSyncing}
        aria-label="Synchronizovat s Google Drive"
        title={config.label}
      >
        <RefreshCw
          className={cn(
            'h-3.5 w-3.5 text-gray-500',
            isSyncing && 'animate-spin text-purple-500'
          )}
        />
      </Button>

      {/* Result badge (shown briefly after sync) */}
      {lastResult && !isSyncing && (
        <SyncResultBadge result={lastResult} onDismiss={() => setLastResult(null)} />
      )}

      {/* Error indicator */}
      {error && !isSyncing && (
        <div className="inline-flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="max-w-[150px] truncate">{error}</span>
        </div>
      )}
    </div>
  )
}

// --- Result badge shown after a successful sync ---

function SyncResultBadge({
  result,
  onDismiss,
}: {
  result: SyncResult
  onDismiss: () => void
}) {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const total = result.added + result.updated + result.deleted

  if (total === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Check className="h-3.5 w-3.5 text-green-500" />
        Zadne zmeny
      </span>
    )
  }

  const parts: string[] = []
  if (result.added > 0) parts.push(`+${result.added}`)
  if (result.updated > 0) parts.push(`~${result.updated}`)
  if (result.deleted > 0) parts.push(`-${result.deleted}`)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        'bg-green-50 dark:bg-green-950/30 text-xs text-green-700 dark:text-green-400',
        'border border-green-200 dark:border-green-800'
      )}
    >
      <Check className="h-3 w-3" />
      {parts.join(' / ')}
    </span>
  )
}
