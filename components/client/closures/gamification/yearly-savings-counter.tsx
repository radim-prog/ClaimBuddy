'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface YearlySavingsCounterProps {
  totalSavings: number // total tax savings for the year
  documentCount: number // number of matched documents contributing
  year: number
  className?: string
}

function useAnimatedCounter(target: number, duration = 1500): number {
  const [value, setValue] = useState(0)
  const startRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = value
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(startRef.current + (target - startRef.current) * eased))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}

const fmtCZK = (n: number) => Math.round(n).toLocaleString('cs-CZ')

export function YearlySavingsCounter({ totalSavings, documentCount, year, className }: YearlySavingsCounterProps) {
  const animatedValue = useAnimatedCounter(totalSavings)

  if (totalSavings <= 0) return null

  return (
    <Card className={cn('border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50', className)}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Letos jste ušetřili na daních
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              {fmtCZK(animatedValue)} Kč
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3.5 w-3.5 text-green-500" />
              {documentCount} dokladů
            </div>
            <p className="text-xs text-muted-foreground">{year}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
