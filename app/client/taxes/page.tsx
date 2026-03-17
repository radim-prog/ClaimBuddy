'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Landmark, Loader2, TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

type TaxSummary = {
  total_revenue: number
  total_expenses: number
  profit: number
  vat_balance: number
}

type TaxPeriod = {
  period: string
  revenue: number
  expenses: number
  vat_output: number
  vat_input: number
}

type MissingDocsImpact = {
  income_tax: number
  social_insurance: number
  health_insurance: number
  vat: number
  total: number
  unmatched_count: number
}

type MonthlyImpact = {
  period: string
  unmatched_count: number
  unmatched_total: number
  breakdown: { income_tax: number; social_insurance: number; health_insurance: number; vat: number; total: number }
  cumulative: { income_tax: number; social_insurance: number; health_insurance: number; vat: number; total: number }
}

type UnmatchedTx = {
  id: string
  amount: number
  counterparty_name: string | null
  description: string | null
  transaction_date: string | null
}

type DetailData = {
  year: number
  legal_form: string
  vat_payer: boolean
  months: MonthlyImpact[]
  total: { income_tax: number; social_insurance: number; health_insurance: number; vat: number; total: number }
  unmatched_count: number
  unmatched_total: number
  unmatched_transactions: Record<string, UnmatchedTx[]>
}

function formatCZK(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount)
}

const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
const monthNamesFull = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

export default function ClientTaxesPage() {
  const { selectedCompanyId, selectedCompany } = useClientUser()
  const [year, setYear] = useState(new Date().getFullYear() - 1)
  const [summary, setSummary] = useState<TaxSummary | null>(null)
  const [periods, setPeriods] = useState<TaxPeriod[]>([])
  const [vatPayer, setVatPayer] = useState(false)
  const [missingImpact, setMissingImpact] = useState<MissingDocsImpact | null>(null)
  const [loading, setLoading] = useState(true)

  // Tab state
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialTab = searchParams?.get('tab') === 'missing' ? 'missing' : 'overview'
  const [activeTab, setActiveTab] = useState<'overview' | 'missing'>(initialTab)

  const sectionEnabled = selectedCompany?.portal_sections?.tax_overview !== false

  useEffect(() => {
    if (!selectedCompanyId || !sectionEnabled) return
    setLoading(true)
    fetch(`/api/client/taxes?company_id=${selectedCompanyId}`)
      .then(r => r.json())
      .then(data => {
        setSummary(data.summary || null)
        setPeriods(data.periods || [])
        setVatPayer(data.vat_payer || false)
        setYear(data.year || new Date().getFullYear())
        setMissingImpact(data.missing_docs_impact || null)
      })
      .catch(() => { setSummary(null); setPeriods([]) })
      .finally(() => setLoading(false))
  }, [selectedCompanyId, sectionEnabled])

  if (!sectionEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Landmark className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">Tato sekce není aktivní. Kontaktujte svou účetní.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    )
  }

  const hasImpact = missingImpact && missingImpact.total > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
          <Landmark className="h-6 w-6 text-purple-600" />
          Daňový přehled {year}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Přehled příjmů, výdajů a daňových povinností</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white'
              : 'text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Přehled
        </button>
        <button
          onClick={() => setActiveTab('missing')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'missing'
              ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white'
              : 'text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Dopad chybějících
          {hasImpact && (
            <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {missingImpact.unmatched_count}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <OverviewTab summary={summary} periods={periods} vatPayer={vatPayer} />
      ) : (
        <MissingDocsTab
          companyId={selectedCompanyId || ''}
          impact={missingImpact}
          vatPayer={vatPayer}
          year={year}
        />
      )}
    </div>
  )
}

// ── Overview Tab (original content) ──

function OverviewTab({
  summary, periods, vatPayer,
}: {
  summary: TaxSummary | null
  periods: TaxPeriod[]
  vatPayer: boolean
}) {
  const chartData = useMemo(() => {
    const sorted = [...periods].sort((a, b) => a.period.localeCompare(b.period))
    let cumRevenue = 0
    let cumExpenses = 0
    return sorted.map(p => {
      cumRevenue += p.revenue || 0
      cumExpenses += p.expenses || 0
      return {
        period: p.period,
        label: p.period.slice(5) + '/' + p.period.slice(2, 4),
        cumRevenue,
        cumExpenses,
        cumProfit: cumRevenue - cumExpenses,
      }
    })
  }, [periods])

  const fmtCzkAxis = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M Kč`
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}tis Kč`
    return `${v.toLocaleString('cs-CZ')} Kč`
  }

  if (!summary) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center text-muted-foreground">
          Žádná daňová data k zobrazení
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Příjmy
            </div>
            <div className="text-xl font-bold text-green-600">{summary.total_revenue.toLocaleString('cs')} Kč</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Výdaje
            </div>
            <div className="text-xl font-bold text-red-600">{summary.total_expenses.toLocaleString('cs')} Kč</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Zisk/Ztráta</div>
            <div className={`text-xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.profit.toLocaleString('cs')} Kč
            </div>
          </CardContent>
        </Card>
        {vatPayer && (
          <Card className="rounded-xl">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                DPH bilance
              </div>
              <div className={`text-xl font-bold ${summary.vat_balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {summary.vat_balance.toLocaleString('cs')} Kč
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {summary.vat_balance >= 0 ? 'K úhradě' : 'Nadměrný odpočet'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {chartData.length > 1 && (
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Kumulativní přehled příjmů a výdajů
            </h3>
            <div className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCumRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCumExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmtCzkAxis} />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCZK(value), name]}
                    labelFormatter={(label: string) => `Období: ${label}`}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cumRevenue" name="Příjmy" stroke="#10b981" fill="url(#gradCumRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cumExpenses" name="Výdaje" stroke="#ef4444" fill="url(#gradCumExpenses)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cumProfit" name="Zisk" stroke="#3b82f6" fill="none" strokeWidth={2} strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {periods.length > 0 && (
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold mb-3">Měsíční přehled</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Měsíc</th>
                    <th className="pb-2 pr-4 text-right">Příjmy</th>
                    <th className="pb-2 pr-4 text-right">Výdaje</th>
                    <th className="pb-2 text-right">Výsledek</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map(p => {
                    const monthIdx = parseInt(p.period.split('-')[1]) - 1
                    const profit = (p.revenue || 0) - (p.expenses || 0)
                    return (
                      <tr key={p.period} className="border-b border-border/50 last:border-0">
                        <td className="py-2 pr-4 font-medium">{monthNames[monthIdx]}</td>
                        <td className="py-2 pr-4 text-right text-green-600">{(p.revenue || 0).toLocaleString('cs')}</td>
                        <td className="py-2 pr-4 text-right text-red-600">{(p.expenses || 0).toLocaleString('cs')}</td>
                        <td className={`py-2 text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profit.toLocaleString('cs')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ── Missing Docs Impact Tab ──

function MissingDocsTab({
  companyId, impact, vatPayer, year,
}: {
  companyId: string
  impact: MissingDocsImpact | null
  vatPayer: boolean
  year: number
}) {
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)

  useEffect(() => {
    setLoadingDetail(true)
    fetch(`/api/client/bank-transactions/tax-impact-detail?company_id=${companyId}&year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setDetail(d) })
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }, [companyId, year])

  if (loadingDetail) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!detail || detail.unmatched_count === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-12 text-center">
          <div className="text-green-600 font-medium text-lg mb-1">Všechny výdaje jsou spárované</div>
          <p className="text-sm text-muted-foreground">Nemáte žádné nedoložené výdaje za rok {year}.</p>
        </CardContent>
      </Card>
    )
  }

  const currentMonth = new Date().getMonth()
  const chartData = detail.months
    .filter((_, i) => i <= currentMonth)
    .map((m, i) => ({
      name: monthNames[i],
      'Daň z příjmu': m.cumulative.income_tax,
      'Sociální poj.': m.cumulative.social_insurance,
      'Zdravotní poj.': m.cumulative.health_insurance,
      ...(detail.vat_payer ? { 'DPH': m.cumulative.vat } : {}),
    }))

  const activeMonths = detail.months.filter(m => m.unmatched_count > 0)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl border-red-200 dark:border-red-800">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Celkový dopad</div>
            <div className="text-xl font-bold text-red-600">{formatCZK(detail.total.total)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Daň z příjmu</div>
            <div className="text-xl font-bold text-red-500">{formatCZK(detail.total.income_tax)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Pojistné (SP+ZP)</div>
            <div className="text-xl font-bold text-orange-500">
              {formatCZK(detail.total.social_insurance + detail.total.health_insurance)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Nedoložených výdajů</div>
            <div className="text-xl font-bold text-amber-600">{detail.unmatched_count}</div>
            <div className="text-[10px] text-muted-foreground">{formatCZK(detail.unmatched_total)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stacked area chart — cumulative impact */}
      <Card className="rounded-xl">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Kumulativní daňový dopad {year}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSocial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradVat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(value: number) => formatCZK(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Daň z příjmu" stackId="1" stroke="#ef4444" fill="url(#gradTax)" />
                <Area type="monotone" dataKey="Sociální poj." stackId="1" stroke="#f97316" fill="url(#gradSocial)" />
                <Area type="monotone" dataKey="Zdravotní poj." stackId="1" stroke="#f59e0b" fill="url(#gradHealth)" />
                {detail.vat_payer && (
                  <Area type="monotone" dataKey="DPH" stackId="1" stroke="#3b82f6" fill="url(#gradVat)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly table + accordion with transactions */}
      <Card className="rounded-xl">
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold mb-3">Měsíční detail</h3>
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 text-xs text-muted-foreground font-medium px-3 pb-2 border-b">
              <div>Měsíc</div>
              <div className="text-right">Chybí</div>
              <div className="text-right">DzP</div>
              <div className="text-right">SP+ZP</div>
              {detail.vat_payer && <div className="text-right">DPH</div>}
              <div className="text-right font-semibold">Kumulativně</div>
            </div>

            {activeMonths.map(m => {
              const monthIdx = parseInt(m.period.split('-')[1]) - 1
              const isExpanded = expandedMonth === m.period
              const txs = detail.unmatched_transactions[m.period] || []

              return (
                <div key={m.period}>
                  <button
                    onClick={() => setExpandedMonth(isExpanded ? null : m.period)}
                    className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 text-sm px-3 py-2 hover:bg-muted/50 rounded-md transition-colors items-center"
                  >
                    <div className="flex items-center gap-1.5 text-left font-medium">
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      {monthNamesFull[monthIdx]}
                    </div>
                    <div className="text-right">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-1.5 py-0.5 rounded-full">
                        {m.unmatched_count}
                      </span>
                    </div>
                    <div className="text-right text-red-600">{formatCZK(m.breakdown.income_tax)}</div>
                    <div className="text-right text-orange-600">{formatCZK(m.breakdown.social_insurance + m.breakdown.health_insurance)}</div>
                    {detail.vat_payer && <div className="text-right text-blue-600">{formatCZK(m.breakdown.vat)}</div>}
                    <div className="text-right font-bold text-red-700 dark:text-red-300">{formatCZK(m.cumulative.total)}</div>
                  </button>

                  {/* Expanded: transaction list */}
                  {isExpanded && txs.length > 0 && (
                    <div className="ml-6 mr-2 mb-2 border rounded-lg overflow-hidden">
                      <div className="bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">
                        Nedoložené transakce — {monthNamesFull[monthIdx]}
                      </div>
                      {txs.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between px-3 py-1.5 text-xs border-b last:border-0 hover:bg-muted/20">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="font-medium">{tx.counterparty_name || tx.description || 'Bez popisu'}</span>
                            {tx.transaction_date && (
                              <span className="text-muted-foreground">{tx.transaction_date}</span>
                            )}
                          </div>
                          <span className="font-bold text-red-600 whitespace-nowrap">{formatCZK(tx.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {activeMonths.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Žádné měsíce s nedoloženými výdaji
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
