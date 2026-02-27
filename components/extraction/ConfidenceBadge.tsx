'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ConfidenceBadge({ 
  score, 
  showLabel = true,
  size = 'md' 
}: ConfidenceBadgeProps) {
  const getColor = (s: number) => {
    if (s >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
    if (s >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
  }

  const getIcon = (s: number) => {
    if (s >= 90) return '●'
    if (s >= 70) return '◐'
    return '○'
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(getColor(score), sizeClasses[size], 'font-medium')}
    >
      <span className="mr-1">{getIcon(score)}</span>
      {showLabel ? 'Jistota: ' : ''}{score}%
    </Badge>
  )
}
