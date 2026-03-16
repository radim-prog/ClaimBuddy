'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Building2, Phone, Calculator, Banknote, FileText, Info,
  ChevronDown, ChevronRight, Check, Loader2, Save, Send,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { toast } from 'sonner'
import {
  ONBOARDING_QUESTIONNAIRE_SECTIONS,
  countOnboardingAnswered,
  type OnboardingResponses,
  type OnboardingSection,
  type OnboardingQuestion,
} from '@/lib/onboarding-questionnaire-def'

const ICON_MAP: Record<string, React.ElementType> = {
  building: Building2, phone: Phone, calculator: Calculator,
  banknote: Banknote, 'file-text': FileText, info: Info,
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Koncept', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  sent: { label: 'Čeká na vyplnění', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'Rozpracováno', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  completed: { label: 'Odesláno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  reviewed: { label: 'Zkontrolováno', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
}

export default function OnboardingQuestionnairePage() {
  const { selectedCompanyId, selectedCompany } = useClientUser()
  const [questionnaire, setQuestionnaire] = useState<any>(null)
  const [responses, setResponses] = useState<OnboardingResponses>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['company_info']))

  const fetchQuestionnaire = useCallback(async () => {
    if (!selectedCompanyId) return
    try {
      const res = await fetch(`/api/client/onboarding-questionnaire?company_id=${selectedCompanyId}`)
      const data = await res.json()
      if (data.questionnaire) {
        setQuestionnaire(data.questionnaire)
        setResponses(data.questionnaire.responses || {})
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [selectedCompanyId])

  useEffect(() => { fetchQuestionnaire() }, [fetchQuestionnaire])

  const saveResponses = useCallback(async (submit = false) => {
    if (!questionnaire?.id) return
    setSaving(true)
    try {
      const res = await fetch('/api/client/onboarding-questionnaire', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: questionnaire.id,
          responses,
          status: submit ? 'completed' : 'in_progress',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setQuestionnaire(data.questionnaire)
        toast.success(submit ? 'Dotazník odeslán účetní' : 'Uloženo')
      } else {
        toast.error('Chyba při ukládání')
      }
    } catch { toast.error('Chyba při ukládání') }
    finally { setSaving(false) }
  }, [questionnaire?.id, responses])

  const setResponse = (key: string, value: string | boolean | null) => {
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { answered, total } = countOnboardingAnswered(responses)
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0
  const isReadOnly = questionnaire?.status === 'completed' || questionnaire?.status === 'reviewed'
  const statusInfo = STATUS_LABELS[questionnaire?.status || 'sent']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-semibold mb-2">Žádný onboarding dotazník</h2>
        <p className="text-sm text-muted-foreground">
          Zatím pro vás nebyl vytvořen vstupní dotazník.
          Kontaktujte svou účetní pro jeho vytvoření.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Vstupní dotazník</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {selectedCompany?.name} — {answered}/{total} otázek vyplněno
          </p>
        </div>
        <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Postup</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {ONBOARDING_QUESTIONNAIRE_SECTIONS.map(section => (
          <OnboardingSectionCard
            key={section.id}
            section={section}
            responses={responses}
            expanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            onResponse={setResponse}
            readOnly={isReadOnly}
          />
        ))}
      </div>

      {/* Footer actions */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex items-center justify-between z-50">
          <div className="text-sm text-muted-foreground">
            {answered}/{total} vyplněno ({progress}%)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => saveResponses(false)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Uložit
            </Button>
            <Button size="sm" onClick={() => saveResponses(true)} disabled={saving || progress < 30}>
              <Send className="h-4 w-4 mr-1" />
              Odeslat účetní
            </Button>
          </div>
        </div>
      )}

      {isReadOnly && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {questionnaire.status === 'reviewed'
              ? 'Dotazník byl zkontrolován účetní.'
              : 'Dotazník byl odeslán. Účetní ho zpracuje.'}
          </p>
        </div>
      )}
    </div>
  )
}

// --- Section Card ---

function OnboardingSectionCard({
  section, responses, expanded, onToggle, onResponse, readOnly,
}: {
  section: OnboardingSection
  responses: OnboardingResponses
  expanded: boolean
  onToggle: () => void
  onResponse: (key: string, value: string | boolean | null) => void
  readOnly: boolean
}) {
  const Icon = ICON_MAP[section.icon] || Info
  const sectionAnswered = section.questions.filter(q => {
    if (q.conditionalOn && responses[q.conditionalOn] !== true) return false
    const val = responses[q.id]
    return val !== undefined && val !== null && val !== ''
  }).length
  const sectionTotal = section.questions.filter(q => {
    if (q.conditionalOn && responses[q.conditionalOn] !== true) return false
    return true
  }).length
  const isComplete = sectionAnswered === sectionTotal && sectionTotal > 0

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isComplete ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
          )}>
            {isComplete
              ? <Check className="h-4 w-4 text-green-600" />
              : <Icon className="h-4 w-4 text-blue-600" />
            }
          </div>
          <div>
            <span className="font-medium text-sm">{section.title}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {sectionAnswered}/{sectionTotal}
            </span>
          </div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-4 space-y-3">
          {section.questions.map(q => (
            <OnboardingQuestionField
              key={q.id}
              question={q}
              value={responses[q.id]}
              responses={responses}
              onChange={(val) => onResponse(q.id, val)}
              readOnly={readOnly}
            />
          ))}
        </CardContent>
      )}
    </Card>
  )
}

// --- Question Field ---

function OnboardingQuestionField({
  question, value, responses, onChange, readOnly,
}: {
  question: OnboardingQuestion
  value: unknown
  responses: OnboardingResponses
  onChange: (val: string | boolean | null) => void
  readOnly: boolean
}) {
  if (question.conditionalOn && responses[question.conditionalOn] !== true) {
    return null
  }

  if (question.type === 'yesno') {
    return (
      <div className="flex items-center justify-between py-1.5">
        <div>
          <span className="text-sm pr-4">{question.label}</span>
          {question.hint && <p className="text-[10px] text-muted-foreground">{question.hint}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            disabled={readOnly}
            onClick={() => onChange(true)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              value === true
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200'
            )}
          >
            Ano
          </button>
          <button
            disabled={readOnly}
            onClick={() => onChange(false)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              value === false
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200'
            )}
          >
            Ne
          </button>
        </div>
      </div>
    )
  }

  if (question.type === 'text') {
    return (
      <div className="py-1.5">
        <label className="text-sm font-medium block mb-1">{question.label}</label>
        {question.hint && <p className="text-[10px] text-muted-foreground mb-1">{question.hint}</p>}
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          disabled={readOnly}
          className="h-8 text-sm"
        />
      </div>
    )
  }

  if (question.type === 'select') {
    return (
      <div className="py-1.5">
        <label className="text-sm font-medium block mb-1">{question.label}</label>
        {question.hint && <p className="text-[10px] text-muted-foreground mb-1">{question.hint}</p>}
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className="w-full h-8 px-2 text-sm border rounded-md bg-background"
        >
          <option value="">Vyberte...</option>
          {(question.options || []).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }

  return null
}
