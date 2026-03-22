'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MatchingQualityData {
  auto: number
  manual: number
  suggested: number
  unmatched: number
  private: number
  total: number
}

interface MatchingQualityCardProps {
  data: MatchingQualityData
  className?: string
}

const segments = [
  { key: 'auto', label: 'Automaticky', color: 'bg-green-500', textColor: 'text-green-600' },
  { key: 'manual', label: 'Manuálně', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { key: 'suggested', label: 'Návrhy', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
  { key: 'unmatched', label: 'Nespárováno', color: 'bg-red-500', textColor: 'text-red-600' },
  { key: 'private', label: 'Soukromé', color: 'bg-gray-400', textColor: 'text-gray-500' },
] as const

export function MatchingQualityCard({ data, className }: MatchingQualityCardProps) {
  const total = data.total || 1 // avoid division by zero

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Kvalita párování</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked bar */}
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
          {segments.map(({ key, color }) => {
            const value = data[key as keyof MatchingQualityData] as number
            const pct = (value / total) * 100
            if (pct <= 0) return null
            return (
              <div
                key={key}
                className={cn('transition-all duration-500', color)}
                style={{ width: `${pct}%` }}
                title={`${key}: ${value} (${Math.round(pct)}%)`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
          {segments.map(({ key, label, color, textColor }) => {
            const value = data[key as keyof MatchingQualityData] as number
            if (value <= 0) return null
            const pct = Math.round((value / total) * 100)
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={cn('w-2.5 h-2.5 rounded-sm shrink-0', color)} />
                <span className="text-muted-foreground">{label}</span>
                <span className={cn('font-mono font-medium ml-auto', textColor)}>
                  {value} <span className="text-muted-foreground">({pct}%)</span>
                </span>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t text-sm">
          <span className="text-muted-foreground">Celkem transakcí</span>
          <span className="font-bold tabular-nums">{data.total}</span>
        </div>
      </CardContent>
    </Card>
  )
}
