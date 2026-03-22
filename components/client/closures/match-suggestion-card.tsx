'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Link2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatchSuggestion {
  id: string
  amount: number
  transaction_date: string
  counterparty_name?: string | null
  variable_symbol?: string | null
  description?: string | null
  match_confidence?: number | null
  matched_document_id?: string | null
  matched_invoice_id?: string | null
}

interface MatchSuggestionCardProps {
  transaction: MatchSuggestion
  onConfirm: (txId: string) => Promise<void>
  onReject: (txId: string) => Promise<void>
  onManualMatch?: (txId: string) => void
  className?: string
}

export function MatchSuggestionCard({ transaction: tx, onConfirm, onReject, onManualMatch, className }: MatchSuggestionCardProps) {
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)

  const handleConfirm = async () => {
    setLoading('confirm')
    try { await onConfirm(tx.id) } finally { setLoading(null) }
  }

  const handleReject = async () => {
    setLoading('reject')
    try { await onReject(tx.id) } finally { setLoading(null) }
  }

  const confidence = Math.round((tx.match_confidence || 0) * 100)

  return (
    <Card className={cn('border-yellow-200 dark:border-yellow-800', className)}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {tx.counterparty_name || tx.description || 'Neznámý'}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {confidence}% shoda
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{tx.transaction_date}</span>
              {tx.variable_symbol && <span>VS: {tx.variable_symbol}</span>}
              {tx.matched_document_id && <span>Doklad</span>}
              {tx.matched_invoice_id && <span>Faktura</span>}
            </div>
          </div>

          <span className={cn(
            'text-sm font-mono font-medium tabular-nums shrink-0',
            tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {tx.amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleConfirm}
              disabled={!!loading}
            >
              {loading === 'confirm' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleReject}
              disabled={!!loading}
            >
              {loading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
            {onManualMatch && (
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onManualMatch(tx.id)}
                disabled={!!loading}
              >
                <Link2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
