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
    if (s >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (s >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
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
