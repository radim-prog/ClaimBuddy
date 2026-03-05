'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, Wallet, TrendingUp, FileText } from 'lucide-react'

interface BudgetData {
  total_hours: number
  total_billable_hours: number
  hourly_rate: number
  estimated_revenue: number
  total_invoiced: number
  remaining: number
}

interface BillingReportProps {
  projectId: string
}

export function BillingReport({ projectId }: BillingReportProps) {
  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/budget`, {
      headers: { 'x-user-id': 'radim' },
    })
      .then(r => r.json())
      .then(data => setBudget(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  if (!budget) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Data o rozpočtu nejsou k dispozici</div>
  }

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h} hod ${m} min` : `${h} hod`
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-xl shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
              <Clock className="h-4 w-4" />
              Celkem hodin
            </div>
            <div className="text-2xl font-bold">{formatDuration(budget.total_hours)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
              <Wallet className="h-4 w-4" />
              Fakturovatelné
            </div>
            <div className="text-2xl font-bold">{formatDuration(budget.total_billable_hours)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{budget.hourly_rate} Kč/hod</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
              <TrendingUp className="h-4 w-4" />
              Odhadovaný výnos
            </div>
            <div className="text-2xl font-bold text-purple-700">{budget.estimated_revenue.toLocaleString()} Kč</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-soft-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
              <FileText className="h-4 w-4" />
              Fakturováno
            </div>
            <div className="text-2xl font-bold text-green-700">{budget.total_invoiced.toLocaleString()} Kč</div>
            {budget.remaining > 0 && (
              <div className="text-xs text-orange-600 mt-1">Zbývá: {budget.remaining.toLocaleString()} Kč</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary card */}
      <Card className="rounded-xl shadow-soft-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Celkem k fakturaci</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Sazba: {budget.hourly_rate} Kč/hod
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-700">{formatDuration(budget.total_billable_hours)}</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{budget.estimated_revenue.toLocaleString()} Kč</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="text-sm" disabled>
          Export do Excel
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700 text-sm" disabled>
          Vygenerovat fakturu
        </Button>
      </div>
    </div>
  )
}
