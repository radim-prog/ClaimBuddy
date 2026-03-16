'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardList, Check, X, ChevronDown, ChevronRight,
  Loader2, Send, CheckCircle2, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ONBOARDING_QUESTIONNAIRE_SECTIONS,
  countOnboardingAnswered,
  type OnboardingResponses,
} from '@/lib/onboarding-questionnaire-def'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Koncept', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  sent: { label: 'Odesláno klientovi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Send },
  in_progress: { label: 'Klient vyplňuje', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  completed: { label: 'Vyplněno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
  reviewed: { label: 'Zkontrolováno', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', icon: CheckCircle2 },
}

interface QuestionnaireRecord {
  id: string
  status: 'draft' | 'sent' | 'in_progress' | 'completed' | 'reviewed'
  responses: OnboardingResponses
}

interface OnboardingQuestionnaireViewerProps {
  companyId: string
}

export function OnboardingQuestionnaireViewer({ companyId }: OnboardingQuestionnaireViewerProps) {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/accountant/companies/${companyId}/onboarding-questionnaire`
        )
        if (res.ok) {
          const data = await res.json()
          setQuestionnaire(data.questionnaire)
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [companyId])

  const sendToClient = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/onboarding-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setQuestionnaire(data.questionnaire)
      }
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  const markReviewed = async () => {
    setReviewing(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/onboarding-questionnaire`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setQuestionnaire(data.questionnaire)
      }
    } catch { /* silent */ }
    finally { setReviewing(false) }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // No questionnaire — offer to create one
  if (!questionnaire) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vstupní dotazník klienta</p>
                <p className="text-xs text-muted-foreground">Dosud neodeslán</p>
              </div>
            </div>
            <Button size="sm" onClick={sendToClient} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Odeslat klientovi
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const responses: OnboardingResponses = questionnaire.responses || {}
  const { answered, total } = countOnboardingAnswered(responses)
  const statusInfo = STATUS_CONFIG[questionnaire.status] || STATUS_CONFIG.draft
  const StatusIcon = statusInfo.icon

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Vstupní dotazník klienta</p>
              <p className="text-xs text-muted-foreground">{answered}/{total} odpovědí</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            {questionnaire.status === 'completed' && (
              <Button size="sm" variant="outline" onClick={markReviewed} disabled={reviewing}>
                {reviewing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Zkontrolováno
              </Button>
            )}
          </div>
        </div>

        {/* Responses by section */}
        {(questionnaire.status === 'completed' || questionnaire.status === 'reviewed' || questionnaire.status === 'in_progress') && (
          <div className="space-y-1">
            {ONBOARDING_QUESTIONNAIRE_SECTIONS.map(section => {
              const expanded = expandedSections.has(section.id)
              const sectionResponses = section.questions.filter(q => {
                if (q.conditionalOn && responses[q.conditionalOn] !== true) return false
                return responses[q.id] !== undefined && responses[q.id] !== null && responses[q.id] !== ''
              })

              return (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      const next = new Set(expandedSections)
                      expanded ? next.delete(section.id) : next.add(section.id)
                      setExpandedSections(next)
                    }}
                    className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-muted/50 rounded text-left"
                  >
                    <div className="flex items-center gap-2">
                      {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-sm font-medium">{section.title}</span>
                      <span className="text-xs text-muted-foreground">{sectionResponses.length} odpovědí</span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="ml-6 mb-2 space-y-0.5">
                      {section.questions.map(q => {
                        if (q.conditionalOn && responses[q.conditionalOn] !== true) return null
                        const val = responses[q.id]
                        if (val === undefined || val === null) return null

                        return (
                          <div key={q.id} className="flex items-start justify-between py-0.5 text-sm">
                            <span className="text-muted-foreground pr-2">{q.label}</span>
                            <ResponseValue value={val} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResponseValue({ value }: { value: unknown }) {
  if (typeof value === 'boolean') {
    return value ? (
      <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
        <Check className="h-3 w-3" /> Ano
      </span>
    ) : (
      <span className="flex items-center gap-1 text-muted-foreground text-xs">
        <X className="h-3 w-3" /> Ne
      </span>
    )
  }

  return <span className="text-xs font-medium text-right">{String(value)}</span>
}
