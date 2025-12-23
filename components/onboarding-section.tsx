'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  User,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  ArrowRightLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { CollapsibleSection } from '@/components/collapsible-section'
import {
  ClientOnboarding,
  OnboardingStep,
  OnboardingNote,
  calculateOnboardingProgress,
  isOnboardingComplete,
  PRIORITY_CONFIG,
} from '@/lib/types/onboarding'
import { toast } from 'sonner'

interface OnboardingSectionProps {
  companyId: string
  companyName: string
  onboarding: ClientOnboarding
  onOnboardingChange: (onboarding: ClientOnboarding) => void
}

export function OnboardingSection({
  companyId,
  companyName,
  onboarding,
  onOnboardingChange,
}: OnboardingSectionProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({})
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const progress = calculateOnboardingProgress(onboarding.steps)
  const isComplete = isOnboardingComplete(onboarding.steps)
  const priorityConfig = PRIORITY_CONFIG[onboarding.priority]

  const pendingSteps = onboarding.steps.filter(s => !s.completed)
  const completedSteps = onboarding.steps.filter(s => s.completed)
  const requiredPending = pendingSteps.filter(s => s.required)
  const optionalPending = pendingSteps.filter(s => !s.required)

  // Check if stalled (7+ days without activity)
  const lastActivity = new Date(onboarding.last_activity_at)
  const now = new Date()
  const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
  const isStalled = daysSinceActivity >= 7

  const toggleStep = (stepId: string) => {
    const updatedSteps = onboarding.steps.map(step => {
      if (step.id === stepId) {
        const completed = !step.completed
        return {
          ...step,
          completed,
          completed_at: completed ? new Date().toISOString() : undefined,
          completed_by: completed ? 'accountant-1' : undefined,
        }
      }
      return step
    })

    onOnboardingChange({
      ...onboarding,
      steps: updatedSteps,
      last_activity_at: new Date().toISOString(),
    })

    const step = onboarding.steps.find(s => s.id === stepId)
    if (step) {
      toast.success(step.completed ? `Krok "${step.label}" označen jako nedokončený` : `Krok "${step.label}" dokončen`)
    }
  }

  const addStepNote = (stepId: string) => {
    const note = stepNotes[stepId]
    if (!note?.trim()) return

    const updatedSteps = onboarding.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          notes: step.notes ? `${step.notes}\n${note}` : note,
        }
      }
      return step
    })

    onOnboardingChange({
      ...onboarding,
      steps: updatedSteps,
      last_activity_at: new Date().toISOString(),
    })

    setStepNotes(prev => ({ ...prev, [stepId]: '' }))
    toast.success('Poznámka přidána')
  }

  const addGeneralNote = () => {
    if (!newNote.trim()) return

    const note: OnboardingNote = {
      id: `note-${Date.now()}`,
      content: newNote,
      created_at: new Date().toISOString(),
      created_by: 'accountant-1',
      created_by_name: 'Účetní',
    }

    onOnboardingChange({
      ...onboarding,
      notes: [...onboarding.notes, note],
      last_activity_at: new Date().toISOString(),
    })

    setNewNote('')
    toast.success('Poznámka přidána')
  }

  const completeOnboarding = () => {
    if (!isComplete) {
      toast.error('Nejprve dokončete všechny povinné kroky')
      return
    }

    onOnboardingChange({
      ...onboarding,
      status: 'active',
      completed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })

    toast.success(`Onboarding klienta ${companyName} byl úspěšně dokončen!`)
  }

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDaysAgo = (dateString: string) => {
    const date = new Date(dateString)
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'dnes'
    if (days === 1) return 'včera'
    return `před ${days} dny`
  }

  const renderStep = (step: OnboardingStep) => {
    const isExpanded = expandedSteps.has(step.id)

    return (
      <div
        key={step.id}
        className={`border rounded-lg transition-all ${
          step.completed
            ? 'bg-green-50 border-green-200'
            : step.required
            ? 'bg-white border-gray-200 hover:border-purple-300'
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={step.completed}
              onCheckedChange={() => toggleStep(step.id)}
              className={step.completed ? 'data-[state=checked]:bg-green-600' : ''}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-medium ${
                    step.completed ? 'text-green-700 line-through' : 'text-gray-900'
                  }`}
                >
                  {step.label}
                </span>
                {step.required && !step.completed && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    Povinné
                  </Badge>
                )}
                {!step.required && !step.completed && (
                  <Badge variant="outline" className="text-xs">
                    Volitelné
                  </Badge>
                )}
              </div>
              {step.description && (
                <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
              )}
              {step.completed && step.completed_at && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Dokončeno {formatDate(step.completed_at)}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => toggleStepExpanded(step.id)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded section with notes */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t bg-gray-50/50">
            <div className="pt-3 space-y-2">
              {step.notes && (
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  <p className="text-xs text-gray-400 mb-1">Poznámky:</p>
                  <p className="whitespace-pre-wrap">{step.notes}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Přidat poznámku ke kroku..."
                  value={stepNotes[step.id] || ''}
                  onChange={(e) => setStepNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addStepNote(step.id)}
                  disabled={!stepNotes[step.id]?.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <CollapsibleSection
      id="onboarding"
      title="Onboarding"
      icon={Sparkles}
      badge={
        onboarding.status === 'active' ? (
          <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-300">
            Dokončeno
          </Badge>
        ) : isStalled ? (
          <Badge variant="destructive" className="ml-2">
            Zaseklé {daysSinceActivity} dní
          </Badge>
        ) : (
          <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-700 border-purple-300">
            {progress}%
          </Badge>
        )
      }
      defaultOpen={onboarding.status === 'onboarding'}
    >
      {/* Status Header */}
      <div className={`rounded-lg p-4 mb-4 ${
        isStalled ? 'bg-red-50 border border-red-200' :
        onboarding.status === 'active' ? 'bg-green-50 border border-green-200' :
        'bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {isStalled && onboarding.status !== 'active' && (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <h4 className="font-semibold text-gray-900">
                {onboarding.status === 'active' ? 'Onboarding dokončen' : 'Onboarding probíhá'}
              </h4>
              <p className="text-sm text-gray-600">
                Zahájeno: {formatDate(onboarding.started_at)}
                {onboarding.completed_at && ` • Dokončeno: ${formatDate(onboarding.completed_at)}`}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${priorityConfig.bgColor} ${priorityConfig.color} ${priorityConfig.borderColor}`}
          >
            {priorityConfig.label} priorita
          </Badge>
        </div>

        {/* Progress bar */}
        {onboarding.status !== 'active' && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Pokrok</span>
              <span className="font-medium text-purple-700">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isStalled ? 'bg-red-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completedSteps.filter(s => s.required).length} / {onboarding.steps.filter(s => s.required).length} povinných kroků dokončeno
            </p>
          </div>
        )}

        {/* Special tags */}
        <div className="flex flex-wrap gap-2">
          {onboarding.is_new_company_setup && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <Building2 className="h-3 w-3 mr-1" />
              Nová firma
            </Badge>
          )}
          {onboarding.is_restructuring && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              Restrukturalizace
            </Badge>
          )}
          {onboarding.previous_accountant && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              Převzetí od: {onboarding.previous_accountant}
            </Badge>
          )}
          {onboarding.assigned_to_name && (
            <Badge variant="outline" className="bg-gray-100 text-gray-700">
              <User className="h-3 w-3 mr-1" />
              {onboarding.assigned_to_name}
            </Badge>
          )}
        </div>

        {/* Last activity warning */}
        {isStalled && onboarding.status !== 'active' && (
          <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Poslední aktivita: {formatDaysAgo(onboarding.last_activity_at)} - kontaktujte klienta!
          </div>
        )}
      </div>

      {/* Pending Steps */}
      {pendingSteps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Circle className="h-4 w-4 text-gray-400" />
            Zbývající kroky ({pendingSteps.length})
          </h4>
          <div className="space-y-2">
            {requiredPending.map(step => renderStep(step))}
            {optionalPending.length > 0 && (
              <>
                <p className="text-xs text-gray-400 mt-3 mb-1">Volitelné kroky:</p>
                {optionalPending.map(step => renderStep(step))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Completed Steps */}
      {completedSteps.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2 hover:text-gray-700"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Dokončené kroky ({completedSteps.length})
            {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completedSteps.map(step => renderStep(step))}
            </div>
          )}
        </div>
      )}

      {/* Notes Section */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          Poznámky k onboardingu
        </h4>

        {/* Existing notes */}
        {onboarding.notes.length > 0 && (
          <div className="space-y-2 mb-3">
            {onboarding.notes.map(note => (
              <div key={note.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{note.created_by_name || 'Účetní'}</span>
                  <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add note */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Přidat poznámku..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <Button
            variant="outline"
            onClick={addGeneralNote}
            disabled={!newNote.trim()}
            className="self-end"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Complete Onboarding Button */}
      {onboarding.status !== 'active' && (
        <div className="mt-6 pt-4 border-t">
          <Button
            className={`w-full ${
              isComplete
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            onClick={completeOnboarding}
            disabled={!isComplete}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {isComplete ? 'Dokončit onboarding' : `Zbývá ${requiredPending.length} povinných kroků`}
          </Button>
          {!isComplete && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Pro dokončení onboardingu musí být splněny všechny povinné kroky
            </p>
          )}
        </div>
      )}
    </CollapsibleSection>
  )
}
