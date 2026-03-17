'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  DollarSign,
  BarChart3,
  Users,
  Percent,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ProfitRow {
  company_id: string
  company_name: string
  ico: string
  status: string
  monthly_fee: number
  active_months: number
  revenue: number
  cost: number
  profit: number
  margin: number
  total_hours: number
}

interface Summary {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgMargin: number
  profitableCount: number
  lossCount: number
  totalClients: number
}

type SortKey = 'company_name' | 'revenue' | 'cost' | 'profit' | 'margin' | 'total_hours'
type SortDir = 'asc' | 'desc'

export default function ProfitabilityPage() {
  const [rows, setRows] = useState<ProfitRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('profit')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [year] = useState(new Date().getFullYear())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/profitability?year=${year}`)
      .then(r => r.json())
      .then(data => {
        setRows(data.rows ?? [])
        setSummary(data.summary ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'company_name' ? 'asc' : 'desc')
    }
  }

  const filtered = useMemo(() => {
    let list = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => r.company_name.toLowerCase().includes(q) || r.ico?.includes(q))
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv, 'cs') : bv.localeCompare(av, 'cs')
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return list
  }, [rows, search, sortKey, sortDir])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  const kpiCards = summary
    ? [
        {
          label: 'Celkový příjem YTD',
          value: formatCurrency(summary.totalRevenue),
          icon: DollarSign,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
          label: 'Celkové náklady YTD',
          value: formatCurrency(summary.totalCost),
          icon: BarChart3,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-950/30',
        },
        {
          label: 'Celkový zisk YTD',
          value: formatCurrency(summary.totalProfit),
          icon: summary.totalProfit >= 0 ? TrendingUp : TrendingDown,
          color: summary.totalProfit >= 0
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400',
          bg: summary.totalProfit >= 0
            ? 'bg-green-50 dark:bg-green-950/30'
            : 'bg-red-50 dark:bg-red-950/30',
        },
        {
          label: 'Průměrná marže',
          value: `${summary.avgMargin} %`,
          icon: Percent,
          color: summary.avgMargin >= 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400',
          bg: summary.avgMargin >= 0
            ? 'bg-emerald-50 dark:bg-emerald-950/30'
            : 'bg-red-50 dark:bg-red-950/30',
        },
        {
          label: 'Ziskových klientů',
          value: `${summary.profitableCount}`,
          icon: Users,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-950/30',
        },
        {
          label: 'Ztrátových klientů',
          value: `${summary.lossCount}`,
          icon: Users,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/30',
        },
      ]
    : []

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === field ? 'text-purple-500' : 'opacity-40'}`} />
      </span>
    </th>
  )

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{kpi.label}</p>
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg font-semibold">
              Ziskovost per klient — {year}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hledat firmu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">
                    #
                  </th>
                  <SortHeader label="Firma" field="company_name" />
                  <SortHeader label="Příjmy YTD" field="revenue" />
                  <SortHeader label="Náklady YTD" field="cost" />
                  <SortHeader label="Zisk" field="profit" />
                  <SortHeader label="Marže %" field="margin" />
                  <SortHeader label="Hodiny" field="total_hours" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Žádná data k zobrazení.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => {
                    const isProfitable = row.profit >= 0
                    return (
                      <tr
                        key={row.company_id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">{row.company_name}</div>
                          {row.monthly_fee > 0 && (
                            <div className="text-xs text-gray-400">
                              {formatCurrency(row.monthly_fee)}/měs × {row.active_months} měs
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-orange-600 dark:text-orange-400">
                          {formatCurrency(row.cost)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-bold ${
                              isProfitable
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {formatCurrency(row.profit)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              row.margin >= 50
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : row.margin >= 0
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {row.margin} %
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                          {row.total_hours > 0 ? `${row.total_hours}h` : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
