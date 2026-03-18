'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, TrendingUp, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

type FirmOverview = {
  clientCount: number
  mrr: number
  paidThisMonth: number
  overdueCount: number
}

export default function FirmOverviewPage() {
  const [data, setData] = useState<FirmOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [companiesRes, billingRes] = await Promise.all([
          fetch('/api/accountant/companies'),
          fetch('/api/accountant/billing').then(r => r.ok ? r.json() : null).catch(() => null),
        ])
        const companies = companiesRes.ok ? await companiesRes.json() : null

        const currentPeriod = new Date().toISOString().slice(0, 7)
        const paymentsRes = await fetch(`/api/accountant/payments?period=${currentPeriod}`).catch(() => null)
        const payments = paymentsRes && paymentsRes.ok ? await paymentsRes.json() : null

        setData({
          clientCount: companies?.count ?? companies?.companies?.length ?? 0,
          mrr: billingRes?.totalMRR ?? 0,
          paidThisMonth: billingRes?.paidCount ?? payments?.summary?.paid ?? 0,
          overdueCount: billingRes?.overdueCount ?? payments?.summary?.unpaid ?? 0,
        })
      } catch {
        setData({ clientCount: 0, mrr: 0, paidThisMonth: 0, overdueCount: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const kpis = [
    { label: 'Klienti', value: data?.clientCount ?? 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'MRR', value: `${(data?.mrr ?? 0).toLocaleString('cs-CZ')} Kč`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Zaplaceno', value: data?.paidThisMonth ?? 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Neuhrazené', value: data?.overdueCount ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="shadow-soft">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
