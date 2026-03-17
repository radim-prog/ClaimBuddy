'use client'

import { useMemo } from 'react'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FolderOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Banknote,
  BarChart3,
} from 'lucide-react'
import type { InsuranceCase, InsuranceCaseStatus } from '@/lib/types/insurance'
import { insuranceTypeLabel, insuranceStatusLabel, insuranceStatusColor } from '@/lib/types/insurance'

const czk = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

type StatsData = {
  total: number
  active: number
  waiting: number
  resolved_this_month: number
  total_claimed: number
  total_paid: number
  success_rate: number
}

export default function ClaimsStatsPage() {
  const { data: statsData, loading: statsLoading, error: statsError } =
    useCachedFetch<StatsData>('/api/claims/stats')

  const { data: casesData, loading: casesLoading } =
    useCachedFetch<{ cases: InsuranceCase[]; total: number }>('/api/claims/cases?limit=200')

  const loading = statsLoading || casesLoading
  const cases = casesData?.cases ?? []

  // ── Per-type breakdown ──────────────────────────────────────────────────────
  const byType = useMemo(() => {
    const map = new Map<string, { count: number; claimed: number; paid: number }>()
    for (const c of cases) {
      const key = c.insurance_type
      const existing = map.get(key) ?? { count: 0, claimed: 0, paid: 0 }
      existing.count++
      existing.claimed += c.claimed_amount ?? 0
      existing.paid += c.paid_amount ?? 0
      map.set(key, existing)
    }
    return Array.from(map.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count)
  }, [cases])

  // ── Per-insurer breakdown ───────────────────────────────────────────────────
  const byInsurer = useMemo(() => {
    const map = new Map<string, { name: string; count: number; paid: number }>()
    for (const c of cases) {
      const key = c.insurance_company_id ?? '__none__'
      const name = c.insurance_company?.name ?? 'Nezadána'
      const existing = map.get(key) ?? { name, count: 0, paid: 0 }
      existing.count++
      existing.paid += c.paid_amount ?? 0
      map.set(key, existing)
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [cases])

  // ── Per-status breakdown ────────────────────────────────────────────────────
  const byStatus = useMemo(() => {
    const map = new Map<InsuranceCaseStatus, number>()
    for (const c of cases) {
      map.set(c.status, (map.get(c.status) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
  }, [cases])

  // ── Monthly cases (last 6 months) ──────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months: Array<{ label: string; key: string; count: number; resolved: number }> = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' })
      months.push({ label, key, count: 0, resolved: 0 })
    }
    for (const c of cases) {
      const month = c.created_at.slice(0, 7)
      const entry = months.find((m) => m.key === month)
      if (entry) {
        entry.count++
        if (c.status === 'approved' || c.status === 'closed') entry.resolved++
      }
    }
    return months
  }, [cases])

  const maxMonthlyCount = Math.max(...monthlyData.map((m) => m.count), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (statsError) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="py-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400">
            Nepodařilo se načíst statistiky
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Pravděpodobně chybí DB migrace — spusťte{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">
              supabase/migrations/20260317_insurance_claims.sql
            </code>
          </p>
        </CardContent>
      </Card>
    )
  }

  const s = statsData

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
          Statistiky
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Přehled výkonu správy pojistných událostí
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          label="Celkem spisů"
          value={String(s?.total ?? 0)}
        />
        <KpiCard
          icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          label="Aktivních"
          value={String(s?.active ?? 0)}
          sub={s?.waiting ? `${s.waiting} čeká na vyjádření` : undefined}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
          label="Vyřešeno tento měsíc"
          value={String(s?.resolved_this_month ?? 0)}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          label="Úspěšnost"
          value={`${s?.success_rate ?? 0} %`}
          sub="schválených vs. zamítnutých"
        />
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Celkem nárokováno</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {czk.format(s?.total_claimed ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Celkem vyplaceno</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {czk.format(s?.total_paid ?? 0)}
                </p>
                {(s?.total_claimed ?? 0) > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {Math.round(((s?.total_paid ?? 0) / (s?.total_claimed ?? 1)) * 100)} % z nárokovaného
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly bar chart */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Nové spisy — posledních 6 měsíců
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Zatím žádná data</p>
          ) : (
            <div className="flex items-end gap-3 h-36 pt-4">
              {monthlyData.map((m) => {
                const heightPct = maxMonthlyCount > 0 ? (m.count / maxMonthlyCount) * 100 : 0
                const resolvedPct = m.count > 0 ? (m.resolved / m.count) * 100 : 0
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {m.count > 0 ? m.count : ''}
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                      <div
                        className="w-full rounded-t-sm bg-blue-100 dark:bg-blue-900/30 relative overflow-hidden"
                        style={{ height: `${Math.max(heightPct, m.count > 0 ? 8 : 0)}%` }}
                      >
                        {/* Resolved overlay */}
                        <div
                          className="absolute bottom-0 inset-x-0 bg-blue-500 dark:bg-blue-400 rounded-t-sm transition-all"
                          style={{ height: `${resolvedPct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{m.label}</span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-100 dark:bg-blue-900/30" />
              <span className="text-xs text-gray-500">Otevřeno</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-400" />
              <span className="text-xs text-gray-500">Vyřešeno</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By insurer */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Top pojišťovny
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {byInsurer.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Zatím žádná data</p>
            ) : (
              byInsurer.map((item) => {
                const pct = cases.length > 0 ? Math.round((item.count / cases.length) * 100) : 0
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-gray-500 text-xs">{item.count} spisů</span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white w-8 text-right">
                          {pct} %
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* By status */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Stavy případů
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byStatus.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Zatím žádná data</p>
            ) : (
              byStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={`${insuranceStatusColor(status)} text-xs`}>
                    {insuranceStatusLabel(status)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                        style={{
                          width: `${cases.length > 0 ? Math.round((count / cases.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-6 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* By type */}
        <Card className="rounded-xl md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Typy pojištění
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byType.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Zatím žádná data</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {byType.map(({ type, count, claimed, paid }) => (
                  <div
                    key={type}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-1"
                  >
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {insuranceTypeLabel(type as Parameters<typeof insuranceTypeLabel>[0])}
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{count}</p>
                    <div className="text-[10px] text-gray-500 space-y-0.5">
                      <p>Nárok: {czk.format(claimed)}</p>
                      <p>Vypl.: {czk.format(paid)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card className="rounded-xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${iconBg}`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
