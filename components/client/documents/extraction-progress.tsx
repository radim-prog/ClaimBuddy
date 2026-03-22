'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'extracting' | 'verify'

const steps: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Nahrávání' },
  { key: 'extracting', label: 'Vytěžování' },
  { key: 'verify', label: 'Ověření' },
]

interface ExtractionProgressProps {
  currentStep: Step
  className?: string
}

export function ExtractionProgress({ currentStep, className }: ExtractionProgressProps) {
  const currentIdx = steps.findIndex(s => s.key === currentStep)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {steps.map((step, i) => {
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        const isLast = i === steps.length - 1

        return (
          <div key={step.key} className="flex items-center gap-1 flex-1">
            {/* Step circle + label */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500',
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isActive && step.key === 'extracting' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-1">
                <div
                  className={cn(
                    'h-px transition-colors',
                    isDone ? 'bg-green-400' : 'bg-border',
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
