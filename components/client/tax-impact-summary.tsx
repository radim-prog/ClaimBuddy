'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingDown, Receipt, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TaxSummaryData {
  current_month: {
    period: string
    tax_impact: number
    vat_impact: number
    unmatched_count: number
  }
  yearly: {
    tax_impact: number
    vat_impact: number
    total_impact: number
    unmatched_expenses: number
    total_transactions: number
  }
}

interface TaxImpactSummaryProps {
  companyId: string
}

function formatCZK(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(amount)
}

const monthNames = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
]

export function TaxImpactSummary({ companyId }: TaxImpactSummaryProps) {
  const [data, setData] = useState<TaxSummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    fetch(`/api/client/bank-transactions/tax-summary?company_id=${companyId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setData(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.yearly.total_transactions === 0) {
    return null // Don't show if no bank data
  }

  const hasImpact = data.yearly.total_impact > 0
  const currentMonthName = monthNames[new Date().getMonth()]

  return (
    <Card className={hasImpact ? 'border-amber-200 dark:border-amber-800' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {hasImpact ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <Receipt className="h-4 w-4 text-green-600" />
          )}
          Daňový dopad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasImpact ? (
          <div className="space-y-3">
            {/* Current month */}
            {data.current_month.tax_impact + data.current_month.vat_impact > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {currentMonthName} — nespárované výdaje
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    {formatCZK(data.current_month.tax_impact + data.current_month.vat_impact)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({data.current_month.unmatched_count} dokladů)
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>DzP: {formatCZK(data.current_month.tax_impact)}</span>
                  {data.current_month.vat_impact > 0 && (
                    <span>DPH: {formatCZK(data.current_month.vat_impact)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Yearly */}
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Roční kumulativní dopad
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCZK(data.yearly.total_impact)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({data.yearly.unmatched_expenses} výdajů)
                </span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>DzP: {formatCZK(data.yearly.tax_impact)}</span>
                {data.yearly.vat_impact > 0 && (
                  <span>DPH: {formatCZK(data.yearly.vat_impact)}</span>
                )}
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/client/documents?tab=bank">
                Zobrazit nespárované transakce
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Všechny výdaje jsou spárované
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.yearly.total_transactions} transakcí zpracováno
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
