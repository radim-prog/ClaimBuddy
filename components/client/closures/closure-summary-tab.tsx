'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClosureProgressBar } from './closure-progress-bar'
import { TaxImpactBreakdown } from './tax-impact-inline'
import {
  TrendingUp, TrendingDown, Landmark, FileText, Receipt, AlertTriangle,
  Upload, Link2, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryData {
  progress: number
  financials: {
    income: number
    expense: number
    cash_income: number
    cash_expense: number
    net: number
  }
  matching: {
    total: number
    matched: number
    auto_matched: number
    manual_matched: number
    suggested: number
    unmatched: number
    private: number
    recurring: number
  }
  documents: { total: number; approved: number; pending: number }
  tax_impact: {
    income_tax: number
    vat: number
    social_insurance: number
    health_insurance: number
    total: number
  }
  actions: string[]
}

interface ClosureSummaryTabProps {
  data: SummaryData
  onAction?: (action: string) => void
  className?: string
}

const fmtCZK = (n: number) => Math.round(n).toLocaleString('cs-CZ') + ' Kč'

const actionLabels: Record<string, { label: string; icon: typeof Upload }> = {
  upload_bank_statement: { label: 'Nahrát výpis', icon: Upload },
  match_transactions: { label: 'Spárovat transakce', icon: Link2 },
  review_documents: { label: 'Zkontrolovat doklady', icon: FileText },
}

export function ClosureSummaryTab({ data, onAction, className }: ClosureSummaryTabProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Stav uzávěrky</span>
            <span className="text-sm text-muted-foreground">{data.matching.matched} / {data.matching.total} transakcí</span>
          </div>
          <ClosureProgressBar value={data.progress} size="lg" />
        </CardContent>
      </Card>

      {/* Financials */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              Příjmy
            </div>
            <p className="text-lg font-bold text-green-600">{fmtCZK(data.financials.income)}</p>
            {data.financials.cash_income > 0 && (
              <p className="text-xs text-muted-foreground">+ {fmtCZK(data.financials.cash_income)} hotovost</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              Výdaje
            </div>
            <p className="text-lg font-bold text-red-600">{fmtCZK(data.financials.expense)}</p>
            {data.financials.cash_expense > 0 && (
              <p className="text-xs text-muted-foreground">+ {fmtCZK(data.financials.cash_expense)} hotovost</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Landmark className="h-3.5 w-3.5" />
              Bilance
            </div>
            <p className={cn('text-lg font-bold', data.financials.net >= 0 ? 'text-green-600' : 'text-red-600')}>
              {fmtCZK(data.financials.net)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <FileText className="h-3.5 w-3.5" />
              Doklady
            </div>
            <p className="text-lg font-bold">{data.documents.approved}/{data.documents.total}</p>
            {data.documents.pending > 0 && (
              <p className="text-xs text-yellow-600">{data.documents.pending} ke kontrole</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Matching breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Párování transakcí</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{data.matching.auto_matched + data.matching.manual_matched}</p>
              <p className="text-xs text-muted-foreground">Spárováno</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{data.matching.suggested}</p>
              <p className="text-xs text-muted-foreground">Návrhy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{data.matching.unmatched}</p>
              <p className="text-xs text-muted-foreground">Nespárováno</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{data.matching.private}</p>
              <p className="text-xs text-muted-foreground">Soukromé</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax impact */}
      {data.tax_impact.total > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Daňový dopad chybějících dokladů
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaxImpactBreakdown {...data.tax_impact} />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {data.actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Co je třeba udělat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.actions.map(action => {
              const config = actionLabels[action]
              if (!config) return null
              const Icon = config.icon
              return (
                <Button key={action} variant="outline" size="sm" onClick={() => onAction?.(action)}>
                  <Icon className="h-4 w-4 mr-1.5" />
                  {config.label}
                </Button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {data.progress >= 100 && data.actions.length === 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Uzávěrka je kompletní</p>
              <p className="text-sm text-muted-foreground">Všechny transakce jsou spárované a doklady zkontrolované.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
