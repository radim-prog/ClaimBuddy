'use client'

import { useState, useEffect } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type CompanyHealthScore,
  type HealthScoreBreakdown,
  getHealthGrade,
  getHealthGradeLabel,
  getHealthGradeColor,
  DIMENSION_LABELS,
  HEALTH_SCORE_WEIGHTS,
} from '@/lib/types/health-score'

interface HealthScoreCardProps {
  companyId: string
}

export function HealthScoreCard({ companyId }: HealthScoreCardProps) {
  const [data, setData] = useState<CompanyHealthScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const res = await fetch(`/api/accountant/health-scores/${companyId}`)
      if (!res.ok) throw new Error('Failed')
      const result = await res.json()
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [companyId])

  function handleRefresh() {
    setRefreshing(true)
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Activity className="h-4 w-4 animate-pulse" />
        Vypocet skore...
      </div>
    )
  }

  if (!data || data.score === null) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">
            Nedostatek dat pro vypocet
            {data?.months_of_data !== undefined && (
              <span className="ml-1">({data.months_of_data}/3 mesicu)</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-7 w-7 p-0">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    )
  }

  const grade = getHealthGrade(data.score)
  const gradeColor = getHealthGradeColor(grade)

  return (
    <div className="space-y-4">
      {/* Header: Score + Grade */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${gradeColor.bg} ${gradeColor.border} border`}>
            <span className={`text-xl font-bold ${gradeColor.text}`}>{grade}</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.score}</div>
            <div className={`text-xs font-medium ${gradeColor.text}`}>{getHealthGradeLabel(grade)}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-7 w-7 p-0">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Score bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${
            data.score >= 80 ? 'bg-green-500' :
            data.score >= 60 ? 'bg-blue-500' :
            data.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${data.score}%` }}
        />
      </div>

      {/* Breakdown */}
      {data.breakdown && (
        <div className="space-y-2.5">
          {(Object.keys(DIMENSION_LABELS) as (keyof HealthScoreBreakdown)[]).map(dim => {
            const score = data.breakdown![dim]
            const weight = HEALTH_SCORE_WEIGHTS[dim]
            return (
              <div key={dim} className="flex items-center gap-3">
                <div className="w-24 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {DIMENSION_LABELS[dim]}
                  <span className="text-gray-400 dark:text-gray-500 ml-1">({Math.round(weight * 100)}%)</span>
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      score >= 80 ? 'bg-green-400' :
                      score >= 60 ? 'bg-blue-400' :
                      score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right text-gray-700 dark:text-gray-300">{score}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Meta */}
      {data.updated_at && (
        <div className="text-[10px] text-gray-400 dark:text-gray-500">
          Aktualizovano: {new Date(data.updated_at).toLocaleDateString('cs')}
          {data.months_of_data > 0 && ` • ${data.months_of_data} mesicu dat`}
        </div>
      )}
    </div>
  )
}

// Compact badge for lists
export function HealthScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-400">—</span>

  const grade = getHealthGrade(score)
  const color = getHealthGradeColor(grade)

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold ${color.bg} ${color.text}`}>
      {grade}
      <span className="font-normal text-[10px] opacity-80">{score}</span>
    </span>
  )
}
