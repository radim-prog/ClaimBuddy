'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import type { WorkloadSummary } from '@/lib/types/project'

function getUtilizationColor(pct: number): string {
  if (pct > 100) return 'text-red-600'
  if (pct >= 80) return 'text-yellow-600'
  return 'text-green-600'
}

function getProgressColor(pct: number): string {
  if (pct > 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function CapacityOverview() {
  const [workload, setWorkload] = useState<WorkloadSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/accountant/capacity/workload')
      .then(r => r.json())
      .then(data => setWorkload(data.workload || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Načítání...</div>
        </CardContent>
      </Card>
    )
  }

  const overloaded = workload.filter(w => w.utilization_pct > 100).length
  const totalAvailable = workload.reduce((s, w) => s + w.available_hours, 0)
  const totalAssigned = workload.reduce((s, w) => s + w.assigned_estimated_hours, 0)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{workload.length}</p>
                <p className="text-xs text-muted-foreground">Členů týmu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(totalAssigned)}h / {Math.round(totalAvailable)}h</p>
                <p className="text-xs text-muted-foreground">Přiřazeno / Dostupno</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {overloaded > 0 ? (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              ) : (
                <TrendingUp className="h-8 w-8 text-green-500" />
              )}
              <div>
                <p className="text-2xl font-bold">{overloaded}</p>
                <p className="text-xs text-muted-foreground">
                  {overloaded > 0 ? 'Přetížených' : 'Vše v pořádku'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-user table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vytížení týmu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workload.map(w => (
              <div key={w.user_id} className="flex items-center gap-4">
                <div className="w-32 truncate font-medium text-sm">{w.user_name}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 relative">
                      <Progress
                        value={Math.min(w.utilization_pct, 100)}
                        className="h-3"
                      />
                      {w.utilization_pct > 100 && (
                        <div
                          className="absolute top-0 h-3 bg-red-500/30 rounded-r-full"
                          style={{ left: '100%', width: `${Math.min(w.utilization_pct - 100, 50)}%` }}
                        />
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`min-w-[60px] justify-center ${getUtilizationColor(w.utilization_pct)}`}
                    >
                      {w.utilization_pct}%
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Dostupno: {w.available_hours}h</span>
                    <span>Přiřazeno: {w.assigned_estimated_hours}h</span>
                    <span>Skutečnost: {w.actual_hours}h</span>
                    {w.variance_pct !== 0 && (
                      <span className={w.variance_pct > 20 ? 'text-red-500' : ''}>
                        Odchylka: {w.variance_pct > 0 ? '+' : ''}{w.variance_pct}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {workload.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Žádní členové týmu
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
