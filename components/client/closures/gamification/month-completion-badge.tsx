'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MonthCompletionBadgeProps {
  progress: number // 0-100
  size?: number
  showCheckmark?: boolean
  label?: string
  className?: string
}

export function MonthCompletionBadge({
  progress,
  size = 64,
  showCheckmark = true,
  label,
  className,
}: MonthCompletionBadgeProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const clamped = Math.max(0, Math.min(100, progress))
  const isComplete = clamped >= 100

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(clamped), 100)
    return () => clearTimeout(timer)
  }, [clamped])

  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedProgress / 100) * circumference

  const strokeColor = isComplete ? '#22c55e' : clamped >= 75 ? '#eab308' : clamped >= 50 ? '#f97316' : '#ef4444'

  return (
    <div className={cn('relative inline-flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="currentColor" strokeWidth={4}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={strokeColor} strokeWidth={4}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete && showCheckmark ? (
            <svg
              viewBox="0 0 24 24"
              width={size * 0.4}
              height={size * 0.4}
              className="text-green-500 animate-in zoom-in duration-500"
            >
              <path
                d="M5 13l4 4L19 7"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <span className={cn(
              'font-bold tabular-nums',
              size >= 64 ? 'text-lg' : 'text-sm'
            )}>
              {clamped}%
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      )}
    </div>
  )
}
