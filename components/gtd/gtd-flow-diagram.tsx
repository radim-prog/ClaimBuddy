'use client'

import {
  Lightbulb,
  HelpCircle,
  ListChecks,
  Zap,
  Users,
  CalendarDays,
  Trophy,
  Check,
} from 'lucide-react'

type GTDStep = 'capture' | 'clarify' | 'define' | 'twominute' | 'delegate' | 'schedule' | 'score'

interface GTDFlowDiagramProps {
  currentStep: GTDStep
  completedSteps: GTDStep[]
  onStepClick: (step: GTDStep) => void
}

const STEPS: {
  id: GTDStep
  label: string
  icon: typeof Lightbulb
  color: string
  activeColor: string
}[] = [
  { id: 'capture', label: 'Zachycení', icon: Lightbulb, color: 'text-purple-400', activeColor: 'bg-purple-600 text-white' },
  { id: 'clarify', label: 'Řešitelné?', icon: HelpCircle, color: 'text-amber-400', activeColor: 'bg-amber-500 text-white' },
  { id: 'define', label: 'Definice', icon: ListChecks, color: 'text-blue-400', activeColor: 'bg-blue-600 text-white' },
  { id: 'twominute', label: '2 minuty?', icon: Zap, color: 'text-yellow-400', activeColor: 'bg-yellow-500 text-white' },
  { id: 'delegate', label: 'Delegovat?', icon: Users, color: 'text-indigo-400', activeColor: 'bg-indigo-600 text-white' },
  { id: 'schedule', label: 'Plánování', icon: CalendarDays, color: 'text-teal-400', activeColor: 'bg-teal-600 text-white' },
  { id: 'score', label: 'Priorita', icon: Trophy, color: 'text-orange-400', activeColor: 'bg-orange-500 text-white' },
]

export function GTDFlowDiagram({ currentStep, completedSteps, onStepClick }: GTDFlowDiagramProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">GTD Flow</h3>

      <div className="space-y-1">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = currentStep === step.id
          const isClickable = isCompleted
          const Icon = step.icon

          return (
            <div key={step.id}>
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isCurrent
                    ? `${step.activeColor} shadow-sm`
                    : isCompleted
                    ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isCurrent
                    ? 'bg-white/20'
                    : isCompleted
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-gray-200 dark:bg-gray-800'
                }`}>
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Icon className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-gray-400 dark:text-gray-600'}`} />
                  )}
                </div>

                <span className={`font-medium ${isCurrent ? '' : ''}`}>
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="ml-[22px] h-2 w-px bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
