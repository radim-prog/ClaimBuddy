'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Users, CheckSquare, ScanLine, FileText, CheckCircle2, Clock, AlertCircle, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'
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

  const statsJsonRef = useRef<string>('')

  const fetchStats = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/extraction/stats', {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        const json = JSON.stringify(data)
        if (json !== statsJsonRef.current) {
          statsJsonRef.current = json
          setStats(data.stats)
          setByConfidence(data.by_confidence || null)
        }
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
    { label: 'OK', value: byConfidence?.ok ?? 0, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', href: '/accountant/extraction/verify?category=ok' },
    { label: 'Varování', value: byConfidence?.warnings ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', href: '/accountant/extraction/verify?category=warnings' },
    { label: 'Chyby', value: byConfidence?.errors ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', href: '/accountant/extraction/verify?category=errors' },
  ]

  const hasConfidence = byConfidence && (byConfidence.ok > 0 || byConfidence.warnings > 0 || byConfidence.errors > 0)

  return (
    <div className="flex flex-col">
      {/* Compact single-line header: icon + title + tabs + confidence + KPI */}
      <div className="flex items-center justify-between border-b border-border py-1.5 px-1 gap-3 min-h-[40px]">
        {/* Left: icon + title + tabs */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-soft-sm flex-shrink-0">
            <ScanLine className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold font-display flex-shrink-0">Vytěžování</h1>

          <div className="w-px h-5 bg-border flex-shrink-0" />

          <nav className="flex items-center gap-0.5">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href)
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.name}
                </Link>
              )
            })}
          </nav>

          {/* Confidence badges inline */}
          {hasConfidence && (
            <>
              <div className="w-px h-5 bg-border flex-shrink-0" />
              <div className="flex items-center gap-1.5">
                {confidenceBadges.map((badge) => {
                  if (badge.value === 0) return null
                  const Icon = badge.icon
                  return (
                    <Link
                      key={badge.label}
                      href={badge.href}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${badge.bg} ${badge.color}`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{badge.value}</span>
                      <span className="hidden lg:inline">{badge.label}</span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Right: KPI strip */}
        {stats && (
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            {kpiItems.map((kpi, i) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="flex items-center gap-1">
                  {i > 0 && <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />}
                  <Icon className={`h-3 w-3 ${kpi.color}`} />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{kpi.value}</span>
                  <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-3">
        {children}
      </div>
    </div>
  )
}
