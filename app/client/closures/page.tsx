'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClosureProgressBar, ClosureProgressRing } from '@/components/client/closures/closure-progress-bar'
import { TaxImpactInline } from '@/components/client/closures/tax-impact-inline'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { cn } from '@/lib/utils'
import {
  Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ChevronRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

interface MonthData {
  period: string
  status: string | null
  progress: number
  financials: { income: number; expense: number; cash_income: number; cash_expense: number; net: number }
  matching: { total: number; matched: number; unmatched: number; private: number }
  tax_impact: { income_tax: number; vat: number; social_insurance: number; health_insurance: number; total: number }
}

interface YearlySummary {
  year: number
  months: MonthData[]
  totals: { income: number; expense: number; net: number; transactions: number; matched: number; unmatched: number; overall_progress: number }
  tax_impact: { income_tax: number; vat: number; social_insurance: number; health_insurance: number; total: number }
}

const fmtCZK = (n: number) => Math.round(n).toLocaleString('cs-CZ')

export default function ClosuresYearlyPage() {
  const router = useRouter()
  const { visibleCompanies, selectedCompanyId } = useClientUser()
  const companyId = selectedCompanyId || visibleCompanies[0]?.id || ''
  const currentYear = new Date().getFullYear()

  const [data, setData] = useState<YearlySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(currentYear)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    fetch(`/api/client/closures/yearly-summary?company_id=${companyId}&year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId, year])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-center py-10 text-muted-foreground">Nepodařilo se načíst data.</p>
  }

  // Chart data: cumulative tax impact
  let cumTax = 0
  const chartData = data.months.map((m, i) => {
    cumTax += m.tax_impact.total
    return {
      name: monthNames[i],
      period: m.period,
      dopad: Math.round(cumTax),
      mesicni: Math.round(m.tax_impact.total),
    }
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Uzávěrky {year}</h1>
          <p className="text-sm text-muted-foreground">Roční přehled měsíčních uzávěrek</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>← {year - 1}</Button>
          {year < currentYear && (
            <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>{year + 1} →</Button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Příjmy
            </div>
            <p className="text-lg font-bold text-green-600">{fmtCZK(data.totals.income)} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Výdaje
            </div>
            <p className="text-lg font-bold text-red-600">{fmtCZK(data.totals.expense)} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Spárováno
            </div>
            <p className="text-lg font-bold">{data.totals.overall_progress}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              Transakcí
            </div>
            <p className="text-lg font-bold">{data.totals.transactions}</p>
          </CardContent>
        </Card>
        <Card className={data.tax_impact.total > 0 ? 'border-red-200 dark:border-red-800' : ''}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Daňový dopad
            </div>
            <p className="text-lg font-bold text-red-600">{fmtCZK(data.tax_impact.total)} Kč</p>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative tax impact chart */}
      {data.tax_impact.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kumulativní daňový dopad</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString('cs-CZ')} Kč`,
                      name === 'dopad' ? 'Kumulativní' : 'Měsíční',
                    ]}
                  />
                  <Area type="monotone" dataKey="dopad" fill="#fca5a5" stroke="#ef4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly rows */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Měsíce</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {data.months.map((month, i) => {
              const hasData = month.matching.total > 0
              const monthLabel = monthNames[i]

              return (
                <div
                  key={month.period}
                  className={cn(
                    'py-3 flex items-center gap-4 cursor-pointer hover:bg-muted/50 rounded -mx-2 px-2 transition-colors',
                    !hasData && 'opacity-50'
                  )}
                  onClick={() => hasData && router.push(`/client/closures/${month.period}`)}
                >
                  {/* Month label */}
                  <div className="w-10 text-sm font-medium">{monthLabel}</div>

                  {/* Progress ring */}
                  <ClosureProgressRing value={month.progress} size={36} />

                  {/* Financials */}
                  <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-green-600 font-mono">{hasData ? `+${fmtCZK(month.financials.income)}` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-red-600 font-mono">{hasData ? `-${fmtCZK(month.financials.expense)}` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {hasData ? `${month.matching.matched}/${month.matching.total}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0 w-24 text-right">
                    {month.status === 'approved' || month.status === 'closed' ? (
                      <Badge variant="default" className="bg-green-600">Schváleno</Badge>
                    ) : hasData && month.progress >= 100 ? (
                      <Badge variant="secondary">Kompletní</Badge>
                    ) : hasData ? (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">Otevřeno</Badge>
                    ) : null}
                  </div>

                  {/* Tax impact */}
                  <div className="shrink-0 w-20 text-right">
                    {month.tax_impact.total > 0 ? (
                      <TaxImpactInline total={month.tax_impact.total} showIcon={false} />
                    ) : null}
                  </div>

                  {hasData && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
