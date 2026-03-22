'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaxImpactInlineProps {
  total: number
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function TaxImpactInline({ total, className, showIcon = true, size = 'sm' }: TaxImpactInlineProps) {
  if (!total || total === 0) return null

  const formatted = Math.round(total).toLocaleString('cs-CZ')

  return (
    <Badge
      variant="destructive"
      className={cn(
        'font-mono',
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5',
        className
      )}
    >
      {showIcon && <AlertTriangle className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      -{formatted} Kč
    </Badge>
  )
}

interface TaxImpactBreakdownProps {
  income_tax: number
  vat: number
  social_insurance: number
  health_insurance: number
  total: number
  className?: string
}

export function TaxImpactBreakdown({ income_tax, vat, social_insurance, health_insurance, total, className }: TaxImpactBreakdownProps) {
  if (!total || total === 0) return null

  const items = [
    { label: 'Daň z příjmu', value: income_tax },
    { label: 'DPH', value: vat },
    { label: 'Sociální', value: social_insurance },
    { label: 'Zdravotní', value: health_insurance },
  ].filter(i => i.value > 0)

  return (
    <div className={cn('space-y-1', className)}>
      {items.map(item => (
        <div key={item.label} className="flex justify-between text-xs">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-mono text-red-600 dark:text-red-400">
            -{Math.round(item.value).toLocaleString('cs-CZ')} Kč
          </span>
        </div>
      ))}
      <div className="flex justify-between text-sm font-medium border-t pt-1">
        <span>Celkem dopad</span>
        <span className="font-mono text-red-600 dark:text-red-400">
          -{Math.round(total).toLocaleString('cs-CZ')} Kč
        </span>
      </div>
    </div>
  )
}
