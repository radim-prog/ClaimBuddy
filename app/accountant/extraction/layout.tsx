'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Users, CheckSquare, ScanLine, FileText, CheckCircle2, Clock, AlertCircle, Loader2, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

const tabs = [
  { name: 'Klienti', href: '/accountant/extraction/clients', icon: Users },
  { name: 'Verifikace', href: '/accountant/extraction/verify', icon: CheckSquare },
]

type Stats = {
  total: number
  extracted: number
  pending: number
  processing: number
  errors: number
  approved: number
}

type ByConfidence = {
  ok: number
  warnings: number
  errors: number
}

export default function ExtractionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { userId } = useAccountantUser()
  const [stats, setStats] = useState<Stats | null>(null)
  const [byConfidence, setByConfidence] = useState<ByConfidence | null>(null)

  const fetchStats = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/extraction/stats', {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setByConfidence(data.by_confidence || null)
      }
    } catch {
      // silent
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const kpiItems = [
    { label: 'Celkem', value: stats?.total ?? 0, icon: FileText, color: 'text-blue-600' },
    { label: 'Vytěženo', value: stats?.extracted ?? 0, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Čeká', value: stats?.pending ?? 0, icon: Clock, color: 'text-amber-600' },
    { label: 'Schváleno', value: stats?.approved ?? 0, icon: CheckCircle2, color: 'text-violet-600' },
    { label: 'Chyby', value: stats?.errors ?? 0, icon: AlertCircle, color: 'text-red-600' },
  ]

  const confidenceBadges = [
    { label: 'OK', value: byConfidence?.ok ?? 0, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30', href: '/accountant/extraction/verify?category=ok' },
    { label: 'Varování', value: byConfidence?.warnings ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30', href: '/accountant/extraction/verify?category=warnings' },
    { label: 'Chyby', value: byConfidence?.errors ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30', href: '/accountant/extraction/verify?category=errors' },
  ]

  const hasConfidence = byConfidence && (byConfidence.ok > 0 || byConfidence.warnings > 0 || byConfidence.errors > 0)

  return (
    <div className="space-y-4">
      {/* Header with inline metrics */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-soft-sm">
              <ScanLine className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">Vytěžování</h1>
              <p className="text-sm text-muted-foreground">OCR + AI extrakce dokladů</p>
            </div>
          </div>

          {/* KPI metrics strip */}
          {stats && (
            <div className="hidden md:flex items-center gap-1">
              {kpiItems.map((kpi, i) => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="flex items-center gap-1.5">
                    {i > 0 && <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />}
                    <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{kpi.value}</span>
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Confidence badges */}
        {hasConfidence && (
          <div className="flex items-center gap-2">
            {confidenceBadges.map((badge) => {
              if (badge.value === 0) return null
              const Icon = badge.icon
              return (
                <Link
                  key={badge.label}
                  href={badge.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${badge.bg} ${badge.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{badge.value}</span>
                  <span>{badge.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {children}
    </div>
  )
}
