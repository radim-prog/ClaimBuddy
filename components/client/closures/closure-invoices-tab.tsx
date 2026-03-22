'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UnmatchedIncome {
  id: string
  amount: number
  transaction_date: string
  counterparty_name?: string | null
  variable_symbol?: string | null
  description?: string | null
}

interface ClosureInvoicesTabProps {
  matchedCount: number
  unmatchedIncome: UnmatchedIncome[]
  totalIncome: number
  className?: string
}

export function ClosureInvoicesTab({ matchedCount, unmatchedIncome, totalIncome, className }: ClosureInvoicesTabProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.round(totalIncome).toLocaleString('cs-CZ')}
            </p>
            <p className="text-xs text-muted-foreground">Celkové příjmy (Kč)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
            <p className="text-xs text-muted-foreground">Spárováno s fakturou</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{unmatchedIncome.length}</p>
            <p className="text-xs text-muted-foreground">Bez faktury</p>
          </CardContent>
        </Card>
      </div>

      {/* Unmatched income */}
      {unmatchedIncome.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Příjmy bez přiřazené faktury ({unmatchedIncome.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {unmatchedIncome.map(tx => (
                <div key={tx.id} className="py-2 flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-yellow-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {tx.counterparty_name || tx.description || 'Neznámý plátce'}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tx.transaction_date}</span>
                      {tx.variable_symbol && <span>VS: {tx.variable_symbol}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-mono font-medium text-green-600 shrink-0">
                    +{tx.amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {unmatchedIncome.length === 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">Všechny příjmy jsou spárované s fakturami</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
