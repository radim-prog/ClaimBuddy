'use client'

import { useState, useCallback } from 'react'
import { TransactionGroupCard } from './transaction-group-card'
import { MatchSuggestionCard } from './match-suggestion-card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  amount: number
  transaction_date: string
  counterparty_name?: string | null
  variable_symbol?: string | null
  description?: string | null
  match_confidence?: number | null
  matched_document_id?: string | null
  matched_invoice_id?: string | null
  tax_impact?: number | null
  total_impact?: number | null
}

interface TiersData {
  auto: { transactions: Transaction[]; count: number }
  suggestions: { transactions: Transaction[]; count: number }
  unmatched: { transactions: Transaction[]; count: number }
  private: { transactions: Transaction[]; count: number }
}

interface ClosureBankTabProps {
  tiers: TiersData
  companyId: string
  period: string
  onRefresh?: () => void
  className?: string
}

export function ClosureBankTab({ tiers, companyId, period, onRefresh, className }: ClosureBankTabProps) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleMatchAction = useCallback(async (txId: string, action: 'confirm' | 'reject') => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/client/closures/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId, action }),
      })
      if (res.ok) onRefresh?.()
    } finally {
      setActionLoading(false)
    }
  }, [onRefresh])

  const total = tiers.auto.count + tiers.suggestions.count + tiers.unmatched.count + tiers.private.count

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} transakcí celkem
        </p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={actionLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', actionLoading && 'animate-spin')} />
            Obnovit
          </Button>
        )}
      </div>

      {/* Suggestions — prominent, needs user action */}
      {tiers.suggestions.count > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Návrhy k potvrzení ({tiers.suggestions.count})
          </h3>
          {tiers.suggestions.transactions.map(tx => (
            <MatchSuggestionCard
              key={tx.id}
              transaction={tx}
              onConfirm={(id) => handleMatchAction(id, 'confirm')}
              onReject={(id) => handleMatchAction(id, 'reject')}
            />
          ))}
        </div>
      )}

      {/* Unmatched */}
      <TransactionGroupCard tier="unmatched" transactions={tiers.unmatched.transactions} />

      {/* Auto-matched */}
      <TransactionGroupCard tier="auto" transactions={tiers.auto.transactions} />

      {/* Private */}
      <TransactionGroupCard tier="private" transactions={tiers.private.transactions} />
    </div>
  )
}
