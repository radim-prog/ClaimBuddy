'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingDown, Receipt, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface MonthData {
  period: string
  unmatched_count: number
  cumulative: {
    income_tax: number
    social_insurance: number
    health_insurance: number
    vat: number
    total: number
  }
}

interface TaxImpactDetailData {
  year: number
  legal_form: string
  vat_payer: boolean
  months: MonthData[]
  total: {
    income_tax: number
    social_insurance: number
    health_insurance: number
    vat: number
    total: number
  }
  unmatched_count: number
  unmatched_total: number
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

const monthLabels = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

export function TaxImpactSummary({ companyId }: TaxImpactSummaryProps) {
  const [data, setData] = useState<TaxImpactDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    fetch(`/api/client/bank-transactions/tax-impact-detail?company_id=${companyId}`)
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

  if (!data || data.unmatched_count === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-green-600" />
            Daňový dopad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Všechny výdaje jsou spárované
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasImpact = data.total.total > 0

  // Chart data — only months with data up to current month
  const currentMonth = new Date().getMonth() // 0-indexed
  const chartData = data.months
    .filter((_, i) => i <= currentMonth)
    .map((m, i) => ({
      name: monthLabels[i],
      total: m.cumulative.total,
      dzp: m.cumulative.income_tax,
      sp: m.cumulative.social_insurance,
      zp: m.cumulative.health_insurance,
      dph: m.cumulative.vat,
    }))

  return (
    <Card className={hasImpact ? 'border-amber-200 dark:border-amber-800' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Daňový dopad chybějících dokladů
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Total impact with breakdown */}
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Roční kumulativní dopad ({data.unmatched_count} nedoložených výdajů)
            </p>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
              {formatCZK(data.total.total)}
            </div>
            {/* 4-line breakdown */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daň z příjmu:</span>
                <span className="font-medium text-red-600 dark:text-red-400">{formatCZK(data.total.income_tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sociální poj.:</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">{formatCZK(data.total.social_insurance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zdravotní poj.:</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{formatCZK(data.total.health_insurance)}</span>
              </div>
              {data.vat_payer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DPH:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{formatCZK(data.total.vat)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mini area chart — cumulative impact */}
          {chartData.some(d => d.total > 0) && (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => formatCZK(value)}
                    labelFormatter={(label) => `${label} ${data.year}`}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#taxGrad)"
                    name="Celkem"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/client/taxes?tab=missing">
              Zobrazit detail chybějících dokladů
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
