'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentSavingsBadgeProps {
  amount: number // tax savings from this document
  message?: string
  className?: string
}

const fmtCZK = (n: number) => Math.round(n).toLocaleString('cs-CZ')

export function DocumentSavingsBadge({ amount, message, className }: DocumentSavingsBadgeProps) {
  if (!amount || amount <= 0) return null

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300',
        'animate-in fade-in slide-in-from-bottom-1 duration-300',
        className
      )}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      {message || `Tento doklad vám ušetří ${fmtCZK(amount)} Kč`}
    </Badge>
  )
}
