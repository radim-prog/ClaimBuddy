'use client'

import { cn } from '@/lib/utils'

interface FuelGaugeProps {
  currentLevel: number | null
  tankCapacity: number | null
  className?: string
  size?: 'sm' | 'md'
}

export function FuelGauge({ currentLevel, tankCapacity, className, size = 'md' }: FuelGaugeProps) {
  if (currentLevel == null || tankCapacity == null || tankCapacity === 0) {
    return <span className="text-xs text-muted-foreground">N/A</span>
  }

  const percentage = Math.min(100, Math.max(0, (currentLevel / tankCapacity) * 100))
  const color = percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
  const h = size === 'sm' ? 'h-2' : 'h-3'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden', h)}>
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {Math.round(currentLevel)} / {Math.round(tankCapacity)} l
      </span>
    </div>
  )
}
