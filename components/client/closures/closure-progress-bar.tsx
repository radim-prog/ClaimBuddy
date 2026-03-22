'use client'

import { cn } from '@/lib/utils'

interface ClosureProgressBarProps {
  value: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

function getColor(value: number): string {
  if (value >= 100) return 'bg-green-500'
  if (value >= 75) return 'bg-emerald-500'
  if (value >= 50) return 'bg-yellow-500'
  if (value >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

function getTextColor(value: number): string {
  if (value >= 100) return 'text-green-700 dark:text-green-400'
  if (value >= 75) return 'text-emerald-700 dark:text-emerald-400'
  if (value >= 50) return 'text-yellow-700 dark:text-yellow-400'
  if (value >= 25) return 'text-orange-700 dark:text-orange-400'
  return 'text-red-700 dark:text-red-400'
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ClosureProgressBar({ value, size = 'md', showLabel = true, className }: ClosureProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full bg-gray-200 dark:bg-gray-700', sizeMap[size])}>
        <div
          className={cn('rounded-full transition-all duration-500', sizeMap[size], getColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('text-sm font-medium tabular-nums min-w-[3ch] text-right', getTextColor(clamped))}>
          {clamped}%
        </span>
      )}
    </div>
  )
}

// Ring variant for compact display
export function ClosureProgressRing({ value, size = 48, className }: { value: number; size?: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  const strokeColor = clamped >= 100 ? '#22c55e' : clamped >= 50 ? '#eab308' : '#ef4444'

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={3} className="text-gray-200 dark:text-gray-700" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={strokeColor} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-500"
        />
      </svg>
      <span className={cn('absolute text-xs font-bold tabular-nums', getTextColor(clamped))}>
        {clamped}
      </span>
    </div>
  )
}
