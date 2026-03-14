'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

type Stats = {
  total: number
  extracted: number
  pending: number
  processing: number
  errors: number
  approved: number
}

type QueueInfo = {
  length: number
  active: number
}

type ByConfidence = {
  ok: number
  warnings: number
  errors: number
}

export default function ExtractionDashboardPage() {
  const { userId } = useAccountantUser()
  const [stats, setStats] = useState<Stats | null>(null)
  const [queue, setQueue] = useState<QueueInfo | null>(null)
  const [byConfidence, setByConfidence] = useState<ByConfidence | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/extraction/stats', {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setQueue(data.queue)
        setByConfidence(data.by_confidence || null)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 15_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const kpiCards = [
    {
      label: 'Celkem dokladů',
      value: stats?.total ?? 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Vytěženo',
      value: stats?.extracted ?? 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'Čeká na vytěžení',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: 'Schváleno',
      value: stats?.approved ?? 0,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      label: 'Chyby',
      value: stats?.errors ?? 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
    },
  ]

  const confidenceCards = [
    {
      label: 'OK',
      value: byConfidence?.ok ?? 0,
      icon: ShieldCheck,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800 hover:border-green-400',
      href: '/accountant/extraction/verify?category=ok',
    },
    {
      label: 'Varování',
      value: byConfidence?.warnings ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800 hover:border-amber-400',
      href: '/accountant/extraction/verify?category=warnings',
    },
    {
      label: 'Chyby',
      value: byConfidence?.errors ?? 0,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800 hover:border-red-400',
      href: '/accountant/extraction/verify?category=errors',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Active Queue */}
      {(queue && (queue.active > 0 || queue.length > 0)) && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-medium text-sm">Probíhá extrakce</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {queue.active} aktivních, {queue.length} ve frontě
              </span>
            </div>
            <Progress value={queue.active > 0 ? 50 : 0} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Confidence Summary Cards */}
      {byConfidence && (byConfidence.ok > 0 || byConfidence.warnings > 0 || byConfidence.errors > 0) && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Kvalita vytěžení</h3>
          <div className="grid grid-cols-3 gap-3">
            {confidenceCards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.label} href={card.href}>
                  <Card className={`relative overflow-hidden cursor-pointer transition-colors ${card.border}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{card.value}</p>
                          <p className="text-xs text-muted-foreground">{card.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
