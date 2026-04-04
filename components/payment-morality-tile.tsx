'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

type MoralityData = {
  total_records: number
  total_paid: number
  total_unpaid: number
  late_payments: number
  avg_days_to_payment: number | null
  payment_rate: number | null
  current_year: { paid: number; unpaid: number }
  health_payment_score: number | null
  health_total_score: number | null
  recent: Array<{ period: string; paid: boolean }>
}

function getRatingColor(rate: number | null): string {
  if (rate === null) return 'text-gray-400'
  if (rate >= 90) return 'text-green-600 dark:text-green-400'
  if (rate >= 70) return 'text-blue-600 dark:text-blue-400'
  if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getRatingLabel(rate: number | null): string {
  if (rate === null) return 'Bez dat'
  if (rate >= 90) return 'Vzorovy'
  if (rate >= 70) return 'Dobry'
  if (rate >= 50) return 'Prumerny'
  return 'Problematicky'
}

function getRatingBg(rate: number | null): string {
  if (rate === null) return 'bg-gray-100 dark:bg-gray-800'
  if (rate >= 90) return 'bg-green-50 dark:bg-green-900/20'
  if (rate >= 70) return 'bg-blue-50 dark:bg-blue-900/20'
  if (rate >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20'
  return 'bg-red-50 dark:bg-red-900/20'
}

export function PaymentMoralityTile({ companyId }: { companyId: string }) {
  const [data, setData] = useState<MoralityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/accountant/companies/${companyId}/payment-morality`)
        if (res.ok) {
          setData(await res.json())
        }
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [companyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data || data.total_records === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center italic">
        Zatim zadne zaznamy o platbach.
      </p>
    )
  }

  const rateColor = getRatingColor(data.payment_rate)
  const rateLabel = getRatingLabel(data.payment_rate)
  const rateBg = getRatingBg(data.payment_rate)

  return (
    <div className="space-y-4">
      {/* Rating badge */}
      <div className={`flex items-center justify-between p-3 rounded-lg ${rateBg}`}>
        <div className="flex items-center gap-2">
          <TrendingUp className={`h-4 w-4 ${rateColor}`} />
          <span className={`text-sm font-semibold ${rateColor}`}>{rateLabel}</span>
        </div>
        <span className={`text-2xl font-bold ${rateColor}`}>
          {data.payment_rate !== null ? `${data.payment_rate} %` : '—'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Prumer. splatnost</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.avg_days_to_payment !== null ? `${data.avg_days_to_payment} dni` : '—'}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3 w-3 text-gray-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Pozde zaplaceno</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.late_payments}x
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Zaplaceno letos</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.current_year.paid}/{data.current_year.paid + data.current_year.unpaid}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3 w-3 text-purple-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Hodnocení klienta</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {data.health_payment_score !== null ? `${data.health_payment_score}/100` : '—'}
          </span>
        </div>
      </div>

      {/* Mini timeline - last 12 months */}
      {data.recent.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Poslednich 12 mesicu</div>
          <div className="flex gap-1">
            {data.recent.map((r) => {
              const monthLabel = r.period.split('-')[1]
              return (
                <div key={r.period} className="flex-1 text-center" title={`${r.period}: ${r.paid ? 'Zaplaceno' : 'Nezaplaceno'}`}>
                  <div className={`h-6 rounded-sm flex items-center justify-center ${
                    r.paid
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {r.paid
                      ? <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      : <XCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                    }
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 block">{monthLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="text-xs text-gray-500 flex items-center justify-between pt-1 border-t border-border/50">
        <span>Celkem: {data.total_paid} zaplaceno / {data.total_unpaid} nezaplaceno</span>
        {data.health_total_score !== null && (
          <span>Celkovy health: {data.health_total_score}/100</span>
        )}
      </div>
    </div>
  )
}
