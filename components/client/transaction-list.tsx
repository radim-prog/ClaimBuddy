'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BankTransaction {
  id: string
  transaction_date: string
  amount: number
  currency: string
  variable_symbol: string | null
  counterparty_name: string | null
  description: string | null
  category: string
  matched_document_id: string | null
  matched_invoice_id: string | null
  match_confidence: number | null
  match_method: string | null
  tax_impact: number
  vat_impact: number
}

interface TransactionListProps {
  transactions: BankTransaction[]
  loading?: boolean
  onMatchClick: (transaction: BankTransaction) => void
  onCategoryChange: (transactionId: string, category: string) => void
}

const methodLabels: Record<string, string> = {
  variable_symbol: 'VS',
  amount_date: 'Částka',
  fuzzy: 'Název',
  manual: 'Ruční',
}

const categoryLabels: Record<string, string> = {
  invoice_income: 'Faktura',
  other_taxable: 'Zdanitelný',
  private_transfer: 'Soukromý',
  owner_deposit: 'Vklad',
  uncategorized: 'Nezařazeno',
}

function formatAmount(amount: number, currency: string = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency }).format(amount)
}

export function TransactionList({
  transactions,
  loading,
  onMatchClick,
  onCategoryChange,
}: TransactionListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Zatím žádné transakce</p>
          <p className="text-sm text-muted-foreground mt-1">Nahrajte bankovní výpis</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map(tx => {
        const isIncome = tx.amount > 0
        const isMatched = tx.matched_document_id || tx.matched_invoice_id
        const hasTaxImpact = (tx.tax_impact || 0) > 0 || (tx.vat_impact || 0) > 0

        return (
          <Card
            key={tx.id}
            className={cn(
              'transition-colors',
              !isMatched && !isIncome && 'border-amber-200 dark:border-amber-800'
            )}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                {/* Direction icon */}
                <div
                  className={cn(
                    'p-2 rounded-lg shrink-0',
                    isIncome
                      ? 'bg-green-50 dark:bg-green-950/30'
                      : 'bg-red-50 dark:bg-red-950/30'
                  )}
                >
                  {isIncome ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-red-600" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.counterparty_name || tx.description || 'Neznámá transakce'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.transaction_date).toLocaleDateString('cs-CZ')}</span>
                    {tx.variable_symbol && (
                      <>
                        <span>·</span>
                        <span>VS: {tx.variable_symbol}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount + status */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        isIncome ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {formatAmount(tx.amount, tx.currency)}
                    </p>
                    {hasTaxImpact && (
                      <p className="text-xs text-amber-600">
                        -{formatAmount(tx.tax_impact + tx.vat_impact)}
                      </p>
                    )}
                  </div>

                  {isMatched ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {methodLabels[tx.match_method || ''] || 'OK'}
                    </Badge>
                  ) : !isIncome ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
                      onClick={() => onMatchClick(tx)}
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      Přiřadit
                    </Button>
                  ) : (
                    <select
                      value={tx.category}
                      onChange={(e) => onCategoryChange(tx.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-background"
                    >
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
