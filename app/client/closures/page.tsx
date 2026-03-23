'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClosureProgressRing } from '@/components/client/closures/closure-progress-bar'
import { TaxImpactInline } from '@/components/client/closures/tax-impact-inline'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { cn } from '@/lib/utils'
import {
  Loader2, CheckCircle2, AlertTriangle, ChevronRight, ChevronDown,
  TrendingUp, TrendingDown,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
const monthNamesShort = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

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
  const [showFinancials, setShowFinancials] = useState(false)

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

  const monthsWithData = data.months.filter(m => m.matching.total > 0)
  const completedMonths = monthsWithData.filter(m => m.progress >= 100 && m.tax_impact.total === 0)

  // Chart data
  let cumTax = 0
  const chartData = data.months.map((m, i) => {
    cumTax += m.tax_impact.total
    return { name: monthNamesShort[i], period: m.period, dopad: Math.round(cumTax) }
  })

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Měsíční přehled {year}</h1>
          {monthsWithData.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.totals.overall_progress}% kompletní
              {data.tax_impact.total > 0 && (
                <span className="text-red-600 dark:text-red-400"> · chybějící doklady vás stojí {fmtCZK(data.tax_impact.total)} Kč</span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>← {year - 1}</Button>
          {year < currentYear && (
            <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>{year + 1} →</Button>
          )}
        </div>
      </div>

      {/* Monthly rows — simplified */}
      <div className="rounded-lg border bg-card divide-y">
        {data.months.map((month, i) => {
          const hasData = month.matching.total > 0
          const isComplete = month.progress >= 100 && month.tax_impact.total === 0
          const isClosed = month.status === 'approved' || month.status === 'closed'
          const missingCount = month.matching.unmatched

          return (
            <div
              key={month.period}
              className={cn(
                'px-4 py-3 flex items-center gap-3 transition-colors',
                hasData ? 'cursor-pointer hover:bg-muted/50' : 'opacity-40'
              )}
              onClick={() => hasData && router.push(`/client/closures/${month.period}`)}
            >
              {/* Status icon */}
              {isClosed || isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : hasData && month.tax_impact.total > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              ) : hasData ? (
                <ClosureProgressRing value={month.progress} size={28} />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20 shrink-0" />
              )}

              {/* Month name */}
              <span className="w-16 text-sm font-medium">{monthNames[i]}</span>

              {/* Status text */}
              <div className="flex-1 min-w-0">
                {isClosed ? (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Kompletní</span>
                ) : isComplete ? (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Vše v pořádku</span>
                ) : hasData && missingCount > 0 ? (
                  <span className="text-sm text-red-600 dark:text-red-400">
                    Chybí {missingCount} {missingCount === 1 ? 'doklad' : missingCount < 5 ? 'doklady' : 'dokladů'}
                  </span>
                ) : hasData ? (
                  <span className="text-sm text-muted-foreground">{month.matching.matched}/{month.matching.total} spárováno</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              {/* Tax impact badge */}
              <div className="shrink-0">
                {month.tax_impact.total > 0 && (
                  <TaxImpactInline total={month.tax_impact.total} showIcon={false} />
                )}
              </div>

              {/* Action */}
              {hasData && missingCount > 0 ? (
                <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={(e) => { e.stopPropagation(); router.push(`/client/closures/${month.period}`) }}>
                  Doplnit
                </Button>
              ) : hasData ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Collapsible financial overview */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <button
          onClick={() => setShowFinancials(!showFinancials)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <span>Zobrazit finanční přehled</span>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', showFinancials && 'rotate-180')} />
        </button>
        {showFinancials && (
          <div className="border-t px-4 pb-4 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
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
                    <CheckCircle2 className="h-3.5 w-3.5" /> Transakcí
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

            {/* Chart */}
            {data.tax_impact.total > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Kumulativní daňový dopad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => [`${value.toLocaleString('cs-CZ')} Kč`, 'Kumulativní']} />
                        <Area type="monotone" dataKey="dopad" fill="#fca5a5" stroke="#ef4444" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
