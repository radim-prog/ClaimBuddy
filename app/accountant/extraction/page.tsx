'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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

type RecentItem = {
  id: string
  fileName: string
  companyName: string
  status: string
  ocrStatus: string
  confidence: number | null
  updatedAt: string
}

export default function ExtractionDashboardPage() {
  const { userId } = useAccountantUser()
  const [stats, setStats] = useState<Stats | null>(null)
  const [queue, setQueue] = useState<QueueInfo | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])
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
        setRecent(data.recentActivity || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 15_000) // Poll every 15s
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

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Poslední aktivita</h3>
            <Button variant="ghost" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Obnovit
            </Button>
          </div>
          {recent.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Zatím žádná vytěžená data</p>
            </div>
          ) : (
            <div className="divide-y">
              {recent.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.fileName}</p>
                    <p className="text-xs text-muted-foreground">{item.companyName}</p>
                  </div>
                  <StatusBadge status={item.status} ocrStatus={item.ocrStatus} />
                  {item.confidence !== null && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      item.confidence >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      item.confidence >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {item.confidence}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(item.updatedAt).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status, ocrStatus }: { status: string; ocrStatus: string }) {
  if (ocrStatus === 'error') return <Badge variant="destructive" className="text-xs">Chyba</Badge>
  if (status === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Schváleno</Badge>
  if (status === 'extracted') return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Vytěženo</Badge>
  if (ocrStatus === 'processing') return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Zpracovává se</Badge>
  return <Badge variant="outline" className="text-xs">{status}</Badge>
}
