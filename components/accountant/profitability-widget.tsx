'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Clock, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type CompanyProfit = {
  company_id: string
  company_name: string
  revenue: number      // monthly_payments amount
  cost: number         // time_entries × hourly_rate
  profit: number       // revenue - cost
  margin: number       // profit / revenue * 100
  total_minutes: number
}

export function ProfitabilityWidget({ limit = 20 }: { limit?: number }) {
  const [data, setData] = useState<CompanyProfit[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [paymentsRes, timeRes] = await Promise.all([
          fetch(`/api/accountant/payments?year=${period.split('-')[0]}`),
          fetch(`/api/time-entries/summary?period=${period}`),
        ])

        if (!paymentsRes.ok || !timeRes.ok) return

        const payments = await paymentsRes.json()
        const timeSummary = await timeRes.json()

        // Build revenue map from payments (only paid entries for this period)
        const revenueMap = new Map<string, number>()
        const companyNames = new Map<string, string>()

        if (payments.companies) {
          for (const c of payments.companies) {
            companyNames.set(c.id, c.name)
          }
        }

        if (payments.payments) {
          for (const p of payments.payments) {
            if (p.period === period && p.paid) {
              const billing = payments.companies?.find(
                (c: any) => c.id === p.company_id
              )?.billing_settings
              const monthlyFee = billing?.monthly_fee || 0
              revenueMap.set(p.company_id, (revenueMap.get(p.company_id) || 0) + monthlyFee)
            }
          }
        }

        // Build cost map from time entries
        const costMap = new Map<string, { cost: number; minutes: number; name: string }>()
        if (timeSummary.by_company) {
          for (const c of timeSummary.by_company) {
            costMap.set(c.company_id, {
              cost: c.billable_amount || 0,
              minutes: c.total_minutes || 0,
              name: c.company_name,
            })
          }
        }

        // Merge into profitability list
        const allIds = new Set([...revenueMap.keys(), ...costMap.keys()])
        const rows: CompanyProfit[] = []

        for (const id of allIds) {
          const revenue = revenueMap.get(id) || 0
          const costEntry = costMap.get(id)
          const cost = costEntry?.cost || 0
          const profit = revenue - cost
          const name = companyNames.get(id) || costEntry?.name || id

          rows.push({
            company_id: id,
            company_name: name,
            revenue,
            cost: Math.round(cost),
            profit: Math.round(profit),
            margin: revenue > 0 ? Math.round((profit / revenue) * 100) : cost > 0 ? -100 : 0,
            total_minutes: costEntry?.minutes || 0,
          })
        }

        // Sort by profit descending
        rows.sort((a, b) => b.profit - a.profit)
        setData(rows.slice(0, limit))
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period, limit])

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalCost = data.reduce((s, d) => s + d.cost, 0)
  const totalProfit = totalRevenue - totalCost

  const formatCurrency = (n: number) =>
    n.toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 })

  const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60)
    const mins = m % 60
    return mins > 0 ? `${h}h ${mins}m` : `${h}h`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            Ziskovost klientů
          </CardTitle>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-background"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Zatím žádná data</p>
            <p className="text-sm mt-1">Ziskovost se zobrazí po zaznamenání odpracovaného času u klientů.</p>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
              <div>
                <span className="text-muted-foreground">Příjmy</span>
                <p className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Náklady</span>
                <p className="font-semibold text-red-600">{formatCurrency(totalCost)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Zisk</span>
                <p className={cn('font-semibold', totalProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>

            {/* Per-company list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.map((row) => (
                <div
                  key={row.company_id}
                  className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {row.profit > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                    ) : row.profit < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">{row.company_name}</span>
                    {row.total_minutes > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatMinutes(row.total_minutes)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      'font-medium tabular-nums',
                      row.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(row.profit)}
                    </span>
                    <span className={cn(
                      'text-xs tabular-nums w-12 text-right',
                      row.margin >= 50 ? 'text-green-600' :
                      row.margin >= 0 ? 'text-yellow-600' : 'text-red-600'
                    )}>
                      {row.margin}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
