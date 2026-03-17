'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'

const monthLabels: Record<string, string> = {
  '01': 'Led', '02': 'Úno', '03': 'Bře', '04': 'Dub',
  '05': 'Kvě', '06': 'Čvn', '07': 'Čvc', '08': 'Srp',
  '09': 'Zář', '10': 'Říj', '11': 'Lis', '12': 'Pro',
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#9ca3af', '#ef4444']
const PIE_LABELS: Record<string, string> = {
  paid: 'Zaplaceno',
  sent: 'Odesláno',
  draft: 'Koncept',
  overdue: 'Po splatnosti',
}

interface StatsData {
  monthly: Array<{ month: string; income: number; expense: number }>
  statusCounts: { paid: number; sent: number; draft: number; overdue: number }
}

export function DashboardCharts({ companyId }: { companyId: string }) {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/client/invoices/stats?company_id=${companyId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  if (loading || !data) return null

  const hasMonthlyData = data.monthly.some(m => m.income > 0 || m.expense > 0)
  const totalStatuses = Object.values(data.statusCounts).reduce((a, b) => a + b, 0)

  if (!hasMonthlyData && totalStatuses === 0) return null

  const barData = data.monthly.map(m => ({
    ...m,
    label: monthLabels[m.month.split('-')[1]] || m.month,
  }))

  const pieData = Object.entries(data.statusCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: PIE_LABELS[key] || key,
      value,
      key,
    }))

  const pieColorMap: Record<string, string> = {
    paid: PIE_COLORS[0],
    sent: PIE_COLORS[1],
    draft: PIE_COLORS[2],
    overdue: PIE_COLORS[3],
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Bar Chart: Income vs Expense — full width for 12 months */}
      {hasMonthlyData && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Příjmy vs Výdaje — {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString('cs-CZ')} Kč`}
                    labelFormatter={(label) => label}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" name="Příjmy" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Výdaje" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pie Chart: Invoice Status */}
      {totalStatuses > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Stav faktur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.key} fill={pieColorMap[entry.key] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {pieData.map(entry => (
                  <div key={entry.key} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: pieColorMap[entry.key] || '#9ca3af' }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-semibold ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
