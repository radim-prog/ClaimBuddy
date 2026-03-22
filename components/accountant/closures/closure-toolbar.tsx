'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Bell, RefreshCw, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClosureToolbarProps {
  companyId: string
  companyName: string
  period: string
  status?: string | null
  onApprove?: () => void
  onRemind?: () => void
  onRematch?: () => void
  onExport?: (type: 'bank' | 'cash' | 'all') => void
  className?: string
}

export function ClosureToolbar({
  companyId,
  companyName,
  period,
  status,
  onApprove,
  onRemind,
  onRematch,
  onExport,
  className,
}: ClosureToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string, fn?: () => void | Promise<void>) => {
    if (!fn || loading) return
    setLoading(action)
    try {
      await fn()
    } finally {
      setLoading(null)
    }
  }

  const isApproved = status === 'approved' || status === 'closed'

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Approve */}
      <Button
        variant={isApproved ? 'default' : 'outline'}
        size="sm"
        disabled={isApproved || loading !== null}
        onClick={() => handleAction('approve', onApprove)}
        className={isApproved ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        {loading === 'approve' ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
        )}
        {isApproved ? 'Schváleno' : 'Schválit'}
      </Button>

      {/* Remind */}
      <Button
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleAction('remind', onRemind)}
      >
        {loading === 'remind' ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Bell className="h-4 w-4 mr-1.5" />
        )}
        Připomenout
      </Button>

      {/* Re-match */}
      <Button
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleAction('rematch', onRematch)}
      >
        {loading === 'rematch' ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-1.5" />
        )}
        Přepárovat
      </Button>

      {/* Export dropdown-like */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleAction('export', () => onExport?.('all'))}
        >
          {loading === 'export' ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1.5" />
          )}
          Export Pohoda
        </Button>
      </div>

      {/* Status badge */}
      {status && (
        <Badge
          variant={isApproved ? 'default' : 'secondary'}
          className={cn('ml-auto', isApproved && 'bg-green-600')}
        >
          {isApproved ? 'Schváleno' : status === 'open' ? 'Otevřeno' : status}
        </Badge>
      )}
    </div>
  )
}
