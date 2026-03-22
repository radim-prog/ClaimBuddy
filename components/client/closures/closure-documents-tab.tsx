'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle2, AlertCircle, Upload, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaxImpactInline } from './tax-impact-inline'

interface UnmatchedExpense {
  id: string
  amount: number
  transaction_date: string
  counterparty_name?: string | null
  variable_symbol?: string | null
  description?: string | null
  tax_impact?: { total: number } | null
}

interface ClosureDocumentsTabProps {
  documents: { total: number; approved: number; pending: number }
  unmatchedExpenses: UnmatchedExpense[]
  totalTaxImpact: number
  onUpload?: () => void
  className?: string
}

export function ClosureDocumentsTab({ documents, unmatchedExpenses, totalTaxImpact, onUpload, className }: ClosureDocumentsTabProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Document stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{documents.total}</p>
            <p className="text-xs text-muted-foreground">Celkem dokladů</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">{documents.approved}</p>
            <p className="text-xs text-muted-foreground">Schváleno</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{documents.pending}</p>
            <p className="text-xs text-muted-foreground">Ke kontrole</p>
          </CardContent>
        </Card>
      </div>

      {/* Unmatched expenses needing documents */}
      {unmatchedExpenses.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Výdaje bez dokladu ({unmatchedExpenses.length})
              </CardTitle>
              {totalTaxImpact > 0 && (
                <TaxImpactInline total={totalTaxImpact} size="md" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {unmatchedExpenses.map(tx => (
                <div key={tx.id} className="py-2 flex items-center gap-3">
                  <FileText className="h-4 w-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {tx.counterparty_name || tx.description || 'Neznámý příjemce'}
                    </span>
                    <span className="text-xs text-muted-foreground">{tx.transaction_date}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tx.tax_impact?.total ? <TaxImpactInline total={tx.tax_impact.total} /> : null}
                    <span className="text-sm font-mono text-red-600">
                      {tx.amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {onUpload && (
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onUpload}>
                <Upload className="h-4 w-4 mr-1.5" />
                Nahrát chybějící doklady
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {unmatchedExpenses.length === 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">Všechny výdaje mají doklady</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
