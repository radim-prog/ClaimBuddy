'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle2, AlertTriangle, Eye } from 'lucide-react'
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
  matched_dohoda_mesic_id?: string | null
  category?: string | null
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

const fmtCZK = (n: number) => Math.round(Math.abs(n)).toLocaleString('cs-CZ')

const NON_TAXABLE = ['personal', 'private', 'transfer', 'savings', 'tax_payment', 'loan_payment']

function getStatus(tx: Transaction): 'matched' | 'private' | 'missing' {
  if (tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id) return 'matched'
  if (NON_TAXABLE.includes(tx.category as string)) return 'private'
  return 'missing'
}

export function ClosureBankTab({ tiers, companyId, period, onRefresh, className }: ClosureBankTabProps) {
  const allTransactions = useMemo(() => {
    const all = [
      ...tiers.auto.transactions,
      ...tiers.suggestions.transactions,
      ...tiers.unmatched.transactions,
      ...tiers.private.transactions,
    ]
    all.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))
    return all
  }, [tiers])

  const total = allTransactions.length
  const missingCount = allTransactions.filter(tx => getStatus(tx) === 'missing' && tx.amount < 0).length

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} transakcí · {missingCount > 0 ? `${missingCount} bez dokladu` : 'vše v pořádku'}
        </p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Obnovit
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Datum</th>
              <th className="px-3 py-2 text-left font-medium">Popis</th>
              <th className="px-3 py-2 text-right font-medium">Částka</th>
              <th className="px-3 py-2 text-center font-medium">Stav</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allTransactions.map(tx => {
              const status = getStatus(tx)
              const isExpenseMissing = status === 'missing' && tx.amount < 0
              return (
                <tr
                  key={tx.id}
                  className={cn(
                    'transition-colors',
                    isExpenseMissing
                      ? 'bg-red-50/60 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'hover:bg-muted/30'
                  )}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {new Date(tx.transaction_date).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium truncate max-w-[250px]">
                      {tx.counterparty_name || tx.description || '—'}
                    </p>
                    {tx.variable_symbol && (
                      <p className="text-xs text-muted-foreground">VS: {tx.variable_symbol}</p>
                    )}
                  </td>
                  <td className={cn(
                    'px-3 py-2.5 text-right font-mono font-medium whitespace-nowrap',
                    tx.amount > 0 ? 'text-green-600' : 'text-foreground'
                  )}>
                    {tx.amount > 0 ? '+' : '−'}{fmtCZK(tx.amount)} Kč
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {status === 'matched' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Spárováno</span>
                      </span>
                    ) : status === 'private' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Soukromé</span>
                      </span>
                    ) : isExpenseMissing ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Chybí doklad</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Nespárováno</span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
