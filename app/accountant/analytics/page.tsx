'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Settings,
  UserPlus,
  UserMinus,
  ArrowUpRight,
  DollarSign,
  BarChart3,
} from 'lucide-react'

interface RevenueData {
  year: number
  currentMRR: number
  annualProjection: number
  annualTarget: number
  fulfillmentPct: number
  totalActiveClients: number
  avgFee: number
  churnRate: number
  thisMonth: {
    onboarded: number
    churned: number
    newMRR: number
    churnedMRR: number
    netMRR: number
  }
  thisYear: {
    onboarded: number
    churned: number
    newMRR: number
    churnedMRR: number
    netMRR: number
  }
  monthlyData: {
    month: number
    label: string
    actual: number | null
    target: number
    onboarded: number
    churned: number
  }[]
  recentEvents: {
    id: string
    event_type: string
    event_date: string
    monthly_fee: number
    companies: { name: string } | null
  }[]
  goal: { id: string; annual_revenue_target: number } | null
}

const EVENT_LABELS: Record<string, string> = {
  onboarded: 'Onboarding',
  churned: 'Odchod',
  paused: 'Pozastaveno',
  fee_changed: 'Zmena pausalu',
}
const EVENT_COLORS: Record<string, string> = {
  onboarded: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  churned: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  paused: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  fee_changed: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
}

function formatCurrency(n: number) {
  return n.toLocaleString('cs', { maximumFractionDigits: 0 }) + ' Kc'
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [year])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/revenue?year=${year}`)
      const json = await res.json()
      setData(json)
    } catch {
      console.error('Failed to fetch revenue data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-center text-gray-500 py-20">Nepodařilo se nacist data.</p>
  }

  const hasGoal = data.annualTarget > 0
  const maxMRR = Math.max(
    ...data.monthlyData.map(m => Math.max(m.actual || 0, m.target || 0)),
    1
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
            Revenue Growth {year}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Prehled rustu a plneni cilu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>&larr;</Button>
          <span className="text-lg font-bold px-2">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>&rarr;</Button>
          <Link href="/accountant/analytics/goals">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" /> Cile
            </Button>
          </Link>
          <Link href="/accountant/analytics/clients">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1" /> Klienti
            </Button>
          </Link>
        </div>
      </div>

      {/* Top KPIs */}
      {hasGoal && (
        <Card className="rounded-xl shadow-soft border-purple-200 dark:border-purple-800/50 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900 dark:text-purple-200">Rocni cil: {formatCurrency(data.annualTarget)}</span>
              </div>
              <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{data.fulfillmentPct}%</span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(data.fulfillmentPct, 100)}%` }}
              />
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              Projekce na konec roku: {formatCurrency(data.annualProjection)} ({data.fulfillmentPct}%)
            </p>
          </CardContent>
        </Card>
      )}

      {!hasGoal && (
        <Card className="rounded-xl shadow-soft border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6 flex items-center justify-between">
            <p className="text-amber-800 dark:text-amber-300">Neni nastaven rocni cil. Nastavte ho pro sledovani plneni.</p>
            <Link href="/accountant/analytics/goals">
              <Button size="sm">Nastavit cil</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Aktualni MRR"
          value={formatCurrency(data.currentMRR)}
          icon={DollarSign}
          color="purple"
        />
        <KPICard
          title="Aktivni klienti"
          value={String(data.totalActiveClients)}
          subtitle={`Prumerny pausal: ${formatCurrency(data.avgFee)}`}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Churn rate"
          value={`${data.churnRate}%`}
          subtitle={`${data.thisYear.churned} klientu letos`}
          icon={TrendingDown}
          color="red"
        />
        <KPICard
          title="Net MRR letos"
          value={formatCurrency(data.thisYear.netMRR)}
          subtitle={`+${formatCurrency(data.thisYear.newMRR)} / -${formatCurrency(data.thisYear.churnedMRR)}`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* This month + This year */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl shadow-soft">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Tento mesic</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">+{data.thisMonth.onboarded}</p>
                  <p className="text-xs text-gray-500">klientu</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <UserMinus className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.thisMonth.churned}</p>
                  <p className="text-xs text-gray-500">odchodu</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Novy MRR</p>
                <p className="text-lg font-semibold text-green-600">+{formatCurrency(data.thisMonth.newMRR)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ztraceny MRR</p>
                <p className="text-lg font-semibold text-red-600">-{formatCurrency(data.thisMonth.churnedMRR)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-soft">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Letos celkem</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">+{data.thisYear.onboarded}</p>
                  <p className="text-xs text-gray-500">klientu</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <UserMinus className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.thisYear.churned}</p>
                  <p className="text-xs text-gray-500">odchodu</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Novy MRR</p>
                <p className="text-lg font-semibold text-green-600">+{formatCurrency(data.thisYear.newMRR)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ztraceny MRR</p>
                <p className="text-lg font-semibold text-red-600">-{formatCurrency(data.thisYear.churnedMRR)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Chart (simple CSS bars) */}
      <Card className="rounded-xl shadow-soft">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              MRR po mesicich
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-purple-500" /> Skutecnost
              </span>
              {hasGoal && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" /> Plan
                </span>
              )}
            </div>
          </div>
          <div className="flex items-end gap-2 h-48">
            {data.monthlyData.map((m) => {
              const actualPct = m.actual != null ? (m.actual / maxMRR) * 100 : 0
              const targetPct = m.target ? (m.target / maxMRR) * 100 : 0
              const isCurrent = m.month === new Date().getMonth() + 1 && year === new Date().getFullYear()

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      <p className="font-semibold">{m.label} {year}</p>
                      {m.actual != null && <p>MRR: {formatCurrency(m.actual)}</p>}
                      {hasGoal && <p>Cil: {formatCurrency(m.target)}</p>}
                      {m.onboarded > 0 && <p className="text-green-400">+{m.onboarded} novych</p>}
                      {m.churned > 0 && <p className="text-red-400">-{m.churned} odchodu</p>}
                    </div>
                  </div>
                  <div className="w-full flex items-end gap-0.5 h-40">
                    {hasGoal && (
                      <div
                        className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t transition-all duration-500"
                        style={{ height: `${targetPct}%` }}
                      />
                    )}
                    <div
                      className={`flex-1 rounded-t transition-all duration-500 ${
                        m.actual != null
                          ? (m.actual >= m.target && hasGoal)
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                      style={{ height: `${actualPct}%`, minHeight: m.actual != null ? '4px' : '0' }}
                    />
                  </div>
                  <span className={`text-[10px] ${isCurrent ? 'font-bold text-purple-600' : 'text-gray-400'}`}>
                    {m.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent events */}
      <Card className="rounded-xl shadow-soft">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold font-display">Posledni udalosti</h3>
            <Link href="/accountant/analytics/clients" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              Vsechny <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {data.recentEvents.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Zatim zadne udalosti</p>
          ) : (
            <div className="space-y-2">
              {data.recentEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${EVENT_COLORS[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                      {EVENT_LABELS[event.event_type] || event.event_type}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.companies?.name || 'Neznama firma'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {event.monthly_fee != null && (
                      <span className={event.event_type === 'churned' ? 'text-red-600' : 'text-green-600'}>
                        {event.event_type === 'churned' ? '-' : '+'}{formatCurrency(Number(event.monthly_fee))}
                      </span>
                    )}
                    <span className="text-gray-400 text-xs">
                      {new Date(event.event_date).toLocaleDateString('cs')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KPICard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string
  subtitle?: string
  icon: typeof TrendingUp
  color: 'purple' | 'blue' | 'red' | 'green'
}) {
  const colorMap = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  }
  return (
    <Card className="rounded-xl shadow-soft">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
