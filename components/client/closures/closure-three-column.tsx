'use client'

import { cn } from '@/lib/utils'

interface ClosureThreeColumnProps {
  bank: React.ReactNode
  documents: React.ReactNode
  impact: React.ReactNode
  className?: string
}

export function ClosureThreeColumn({ bank, documents, impact, className }: ClosureThreeColumnProps) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4', className)}>
      <div className="lg:col-span-1 space-y-4">
        {bank}
      </div>
      <div className="lg:col-span-1 space-y-4">
        {documents}
      </div>
      <div className="lg:col-span-1 space-y-4">
        {impact}
      </div>
    </div>
  )
}
