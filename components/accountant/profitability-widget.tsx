'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Clock,
  Building2,
} from 'lucide-react'
import { mockCompanies } from '@/lib/mock-data'
import { getClientTimeStats } from '@/lib/mock-data'

type ProfitabilityEntry = {
  companyId: string
  companyName: string
  totalMinutes: number
  billableMinutes: number
  monthlyFee: number
  effectiveHourlyRate: number
  status: 'profitable' | 'neutral' | 'unprofitable'
}

export function ProfitabilityWidget({ limit = 20 }: { limit?: number }) {
  const profitabilityData = useMemo(() => {
    const activeCompanies = (mockCompanies as any[]).filter((c: any) => c.status === 'active')

    const entries: ProfitabilityEntry[] = activeCompanies.map((company: any) => {
      const stats = getClientTimeStats(company.id)
      const totalMinutes = stats.totalMinutes
      const totalHours = totalMinutes / 60

      // Use total_revenue from Pohoda as a proxy for monthly fee
      // If no revenue data, estimate from company size
      const monthlyFee = company.total_revenue > 0
        ? Math.round(company.total_revenue / 12)
        : (company.has_employees ? 5000 : 2000)

      const effectiveHourlyRate = totalHours > 0
        ? Math.round(monthlyFee / totalHours)
        : monthlyFee > 0 ? 999 : 0 // No time logged = infinite rate (good)

      let status: 'profitable' | 'neutral' | 'unprofitable' = 'neutral'
      if (totalHours > 0) {
        if (effectiveHourlyRate >= 500) status = 'profitable'
        else if (effectiveHourlyRate < 300) status = 'unprofitable'
        else status = 'neutral'
      }

      return {
        companyId: company.id,
        companyName: company.name,
        totalMinutes,
        billableMinutes: stats.billableMinutes,
        monthlyFee,
        effectiveHourlyRate,
        status,
      }
    })

    // Sort: unprofitable first (they need attention), then by effective rate ascending
    return entries
      .filter(e => e.totalMinutes > 0) // Only show companies with tracked time
      .sort((a, b) => a.effectiveHourlyRate - b.effectiveHourlyRate)
      .slice(0, limit)
  }, [limit])

  const summary = useMemo(() => {
    const total = profitabilityData.length
    const profitable = profitabilityData.filter(e => e.status === 'profitable').length
    const unprofitable = profitabilityData.filter(e => e.status === 'unprofitable').length
    const totalMinutes = profitabilityData.reduce((sum, e) => sum + e.totalMinutes, 0)
    const totalFees = profitabilityData.reduce((sum, e) => sum + e.monthlyFee, 0)
    return { total, profitable, unprofitable, totalMinutes, totalFees }
  }, [profitabilityData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'profitable') return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
    if (status === 'unprofitable') return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
    return <Minus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
  }

  if (profitabilityData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            Ziskovost klientů
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Zatím žádná data</p>
            <p className="text-sm mt-1">Ziskovost se zobrazí po zaznamenání odpracovaného času u klientů.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          Ziskovost klientů
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Efektivní hodinová sazba na základě odpracovaného času a měsíčního paušálu
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.profitable}</p>
            <p className="text-xs text-green-600 dark:text-green-500">Ziskových</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {summary.total - summary.profitable - summary.unprofitable}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">Neutrálních</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.unprofitable}</p>
            <p className="text-xs text-red-600 dark:text-red-500">Neziskových</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-200">Klient</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-200">Čas</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-200">Paušál/měs.</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-200">Kč/hod</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-700 dark:text-gray-200">Stav</th>
              </tr>
            </thead>
            <tbody>
              {profitabilityData.map((entry) => (
                <tr
                  key={entry.companyId}
                  className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {entry.companyName}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                    {(entry.totalMinutes / 60).toFixed(1)}h
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                    {formatCurrency(entry.monthlyFee)}
                  </td>
                  <td className="py-2 px-2 text-right font-semibold">
                    <span className={
                      entry.status === 'profitable'
                        ? 'text-green-700 dark:text-green-400'
                        : entry.status === 'unprofitable'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-yellow-700 dark:text-yellow-400'
                    }>
                      {formatCurrency(entry.effectiveHourlyRate)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <StatusIcon status={entry.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
