'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Link2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Circle,
  Upload,
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
  matched_dohoda_mesic_id?: string | null
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
  onQuickUpload?: (transaction: BankTransaction) => void
}

const methodLabels: Record<string, string> = {
  variable_symbol: 'VS',
  amount_date: 'Částka',
  fuzzy: 'Název',
  manual: 'Ruční',
  dohoda_amount_name: 'Dohoda',
  dohoda_amount: 'Dohoda',
}

const categoryLabels: Record<string, string> = {
  invoice_income: 'Faktura',
  other_taxable: 'Zdanitelný',
  private_transfer: 'Soukromý',
  owner_deposit: 'Vklad',
  internal_transfer: 'Převod',
  loan_repayment: 'Splátka',
  uncategorized: 'Nezařazeno',
}

const NON_TAXABLE_CATEGORIES = ['private_transfer', 'owner_deposit', 'loan_repayment', 'internal_transfer']

type TxColor = 'green' | 'red' | 'amber' | 'gray'

function getTransactionColor(tx: BankTransaction): TxColor {
  const isMatched = !!(tx.matched_document_id || tx.matched_invoice_id || tx.matched_dohoda_mesic_id)
  const isPrivate = NON_TAXABLE_CATEGORIES.includes(tx.category || '')
  const isExpense = tx.amount < 0

  if (isMatched) return 'green'
  if (isPrivate) return 'gray'
  if (isExpense) return 'red' // missing document
  return 'amber' // income, uncategorized
}

function sortByColor(transactions: BankTransaction[]): BankTransaction[] {
  const order: Record<TxColor, number> = { red: 0, amber: 1, gray: 2, green: 3 }
  return [...transactions].sort((a, b) => {
    const ca = order[getTransactionColor(a)]
    const cb = order[getTransactionColor(b)]
    if (ca !== cb) return ca - cb
    return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  })
}

function formatAmount(amount: number, currency: string = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency }).format(amount)
}

export function TransactionList({
  transactions,
  loading,
  onMatchClick,
  onCategoryChange,
  onQuickUpload,
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

  const sorted = sortByColor(transactions)

  return (
    <div className="space-y-2">
      {sorted.map(tx => {
        const isIncome = tx.amount > 0
        const color = getTransactionColor(tx)

        const borderClass = {
          green: 'border-green-200 dark:border-green-900',
          red: 'border-red-200 dark:border-red-900',
          amber: 'border-amber-200 dark:border-amber-800',
          gray: 'border-gray-200 dark:border-gray-700',
        }[color]

        return (
          <Card key={tx.id} className={cn('transition-colors', borderClass)}>
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
                    <p className={cn('text-sm font-semibold', isIncome ? 'text-green-600' : 'text-red-600')}>
                      {formatAmount(tx.amount, tx.currency)}
                    </p>
                    {color === 'red' && (tx.tax_impact > 0 || tx.vat_impact > 0) && (
                      <p className="text-xs text-red-600">
                        -{formatAmount(tx.tax_impact + tx.vat_impact)}
                      </p>
                    )}
                  </div>

                  {/* Status badge / actions by color */}
                  {color === 'green' ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {methodLabels[tx.match_method || ''] || 'OK'}
                    </Badge>
                  ) : color === 'red' ? (
                    <div className="flex items-center gap-1">
                      {onQuickUpload && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => onQuickUpload(tx)}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Nahrát
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => onMatchClick(tx)}
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Přiřadit
                      </Button>
                    </div>
                  ) : color === 'amber' ? (
                    <select
                      value={tx.category}
                      onChange={(e) => onCategoryChange(tx.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-background"
                    >
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-300 dark:border-gray-600">
                      <Circle className="w-3 h-3 mr-1" />
                      {categoryLabels[tx.category] || 'Soukromé'}
                    </Badge>
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
