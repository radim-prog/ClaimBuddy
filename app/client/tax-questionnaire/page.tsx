'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Banknote, Percent, Receipt, Clock, Shield, HeartPulse, Info,
  ChevronDown, ChevronRight, Check, Loader2, Save, Send,
  Plus, Trash2, CheckCircle2, AlertCircle, FileCheck, HelpCircle, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { UpsellBanner } from '@/components/client/upsell-banner'
import { toast } from 'sonner'
import {
  TAX_QUESTIONNAIRE_SECTIONS,
  HEALTH_INSURANCE_OPTIONS,
  countAnswered,
  type QuestionnaireResponses,
  type ChildEntry,
  type Section,
  type Question,
} from '@/lib/tax-questionnaire-def'
import { QuestionnaireUpload } from '@/components/client/questionnaire-upload'
import { QuestionUpload } from '@/components/client/question-upload'

const ICON_MAP: Record<string, React.ElementType> = {
  banknote: Banknote, percent: Percent, receipt: Receipt, clock: Clock,
  shield: Shield, 'heart-pulse': HeartPulse, info: Info, zap: Zap,
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Koncept', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  sent: { label: 'Čeká na vyplnění', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'Rozpracováno', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  completed: { label: 'Odesláno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  reviewed: { label: 'Zkontrolováno', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
}

export default function TaxQuestionnairePage() {
  const { userId, selectedCompanyId, selectedCompany } = useClientUser()
  const [questionnaire, setQuestionnaire] = useState<any>(null)
  const [responses, setResponses] = useState<QuestionnaireResponses>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['precheck']))
  const year = new Date().getFullYear()

  // Entity type detection: FO (fyzická osoba) or PO (právnická osoba)
  const entityType = (responses['precheck_legal_form'] as string) === 'PO' ? 'PO' : 'FO'

  // Minimal mode: paušální daň + příjem do 2M → most sections don't apply
  const isMinimalMode =
    responses['precheck_flat_tax'] === true && responses['precheck_revenue_limit'] === true

  const fetchQuestionnaire = useCallback(async () => {
    if (!selectedCompanyId) return
    setError(null)
    try {
      const res = await fetch(`/api/client/tax-questionnaire?company_id=${selectedCompanyId}&year=${year}`)
      if (!res.ok) {
        throw new Error(`Načtení dotazníku selhalo (${res.status})`)
      }
      const data = await res.json()
      if (data.questionnaire) {
        setQuestionnaire(data.questionnaire)
        setResponses(data.questionnaire.responses || {})
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst dotazník. Zkuste to prosím znovu.')
    }
    finally { setLoading(false) }
  }, [selectedCompanyId, year])

  useEffect(() => { fetchQuestionnaire() }, [fetchQuestionnaire])

  const saveResponses = useCallback(async (submit = false) => {
    if (!questionnaire?.id) return
    setSaving(true)
    try {
      const res = await fetch('/api/client/tax-questionnaire', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: questionnaire.id,
          responses,
          status: submit ? 'completed' : 'in_progress',
        }),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(errText || `Ukládání selhalo (${res.status})`)
      }
      const data = await res.json()
      setQuestionnaire(data.questionnaire)
      toast.success(submit ? 'Dotazník odeslán účetní' : 'Uloženo')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba při ukládání')
    }
    finally { setSaving(false) }
  }, [questionnaire?.id, responses])

  const setResponse = (key: string, value: string | boolean | ChildEntry[] | null) => {
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

  const { answered, total } = countAnswered(responses, entityType)
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

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500 opacity-75" />
        <h2 className="text-lg font-semibold mb-2">Chyba načítání</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchQuestionnaire() }}>
          Zkusit znovu
        </Button>
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-semibold mb-2">Žádný dotazník</h2>
        <p className="text-sm text-muted-foreground">
          Pro rok {year} zatím nemáte přiřazený daňový dotazník.
          Kontaktujte svou účetní pro jeho vytvoření.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <UpsellBanner message="Daňový dotazník je složitý? Profesionální účetní vám poradí s optimalizací daní." />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h1 className="text-xl font-bold">Daňový dotazník {year}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {selectedCompany?.name} — {answered}/{total} otázek vyplněno
          </p>
        </div>
        <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
      </div>

      {/* Minimal mode banner */}
      {isMinimalMode && (
        <div className="mb-4 flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <Zap className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-emerald-800 dark:text-emerald-200">
            <span className="font-medium">Paušální daň — zjednodušený dotazník.</span>
            {' '}Sekce Sociální pojištění, Zdravotní pojištění a Zálohy se vás pravděpodobně netýkají. Vyplňte jen sekce <span className="font-medium">Příjmy</span> a <span className="font-medium">Doplňující informace</span>.
          </div>
        </div>
      )}

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
        {TAX_QUESTIONNAIRE_SECTIONS.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            responses={responses}
            expanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            onResponse={setResponse}
            readOnly={isReadOnly}
            questionnaireId={questionnaire.id}
            companyId={selectedCompanyId ?? ''}
            entityType={entityType}
          />
        ))}
      </div>

      {/* Required documents checklist */}
      <RequiredDocumentsChecklist />

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
            <Button size="sm" onClick={() => saveResponses(true)} disabled={saving || progress < 50}>
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
              : 'Dotazník byl odeslán. Účetní ho zkontroluje.'}
          </p>
        </div>
      )}
    </div>
  )
}

// --- Section Card ---

function SectionCard({
  section, responses, expanded, onToggle, onResponse, readOnly, questionnaireId, companyId, entityType,
}: {
  section: Section
  responses: QuestionnaireResponses
  expanded: boolean
  onToggle: () => void
  onResponse: (key: string, value: string | boolean | ChildEntry[] | null) => void
  readOnly: boolean
  questionnaireId: string
  companyId: string
  entityType: 'FO' | 'PO'
}) {
  const Icon = ICON_MAP[section.icon] || Info

  // Filter questions by entity type
  const visibleQuestions = section.questions.filter(q =>
    !q.forEntity || q.forEntity === entityType
  )

  const sectionAnswered = visibleQuestions.filter(q => {
    if (q.conditionalOn && responses[q.conditionalOn] !== true) return false
    const val = responses[q.id]
    return val !== undefined && val !== null && val !== ''
  }).length
  const sectionTotal = visibleQuestions.filter(q => {
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
          {visibleQuestions.map(q => (
            <QuestionField
              key={q.id}
              question={q}
              value={responses[q.id]}
              responses={responses}
              onChange={(val) => onResponse(q.id, val)}
              onResponse={onResponse}
              readOnly={readOnly}
              questionnaireId={questionnaireId}
              companyId={companyId}
            />
          ))}
          {section.allowDocUpload && questionnaireId && companyId && (
            <QuestionnaireUpload
              questionnaireId={questionnaireId}
              sectionId={section.id}
              companyId={companyId}
              readOnly={readOnly}
            />
          )}
        </CardContent>
      )}
    </Card>
  )
}

// --- Question Field ---

function QuestionField({
  question, value, responses, onChange, onResponse, readOnly, questionnaireId, companyId, depth = 0,
}: {
  question: Question
  value: unknown
  responses: QuestionnaireResponses
  onChange: (val: string | boolean | ChildEntry[] | null) => void
  onResponse?: (key: string, value: string | boolean | ChildEntry[] | null) => void
  readOnly: boolean
  questionnaireId?: string
  companyId?: string
  depth?: number
}) {
  // Conditional visibility
  if (question.conditionalOn && responses[question.conditionalOn] !== true) {
    return null
  }

  const showFollowUp = value === true && question.followUp && question.followUp.length > 0 && depth < 2
  const showUpload = value === true && question.uploadField && questionnaireId && companyId

  if (question.type === 'yesno') {
    return (
      <div>
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-1 pr-4">
            <span className="text-sm">{question.label}</span>
            {question.hint && <HintIcon hint={question.hint} />}
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
        {/* Follow-up questions */}
        {showFollowUp && onResponse && (
          <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-4 ml-2 space-y-1">
            {question.followUp!.map(fq => (
              <QuestionField
                key={fq.id}
                question={fq}
                value={responses[fq.id]}
                responses={responses}
                onChange={(val) => onResponse(fq.id, val)}
                onResponse={onResponse}
                readOnly={readOnly}
                questionnaireId={questionnaireId}
                companyId={companyId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
        {/* Inline upload */}
        {showUpload && (
          <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-4 ml-2">
            <QuestionUpload
              questionnaireId={questionnaireId!}
              questionId={question.id}
              companyId={companyId!}
              hint={question.uploadField!.hint}
              accept={question.uploadField!.accept}
              readOnly={readOnly}
            />
          </div>
        )}
      </div>
    )
  }

  if (question.type === 'text') {
    return (
      <div className="py-1.5">
        <div className="flex items-center gap-1 mb-1">
          <label className="text-sm font-medium">{question.label}</label>
          {question.hint && <HintIcon hint={question.hint} />}
        </div>
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
        <div className="flex items-center gap-1 mb-1">
          <label className="text-sm font-medium">{question.label}</label>
          {question.hint && <HintIcon hint={question.hint} />}
        </div>
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className="w-full h-8 px-2 text-sm border rounded-md bg-background"
        >
          <option value="">Vyberte...</option>
          {(question.options || HEALTH_INSURANCE_OPTIONS).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }

  if (question.type === 'children') {
    const children = (value as ChildEntry[]) || []
    return (
      <div className="py-1.5 pl-4 border-l-2 border-blue-200">
        <label className="text-sm font-medium block mb-2">{question.label}</label>
        {children.map((child, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <Input
              value={child.name}
              onChange={(e) => {
                const updated = [...children]
                updated[i] = { ...updated[i], name: e.target.value }
                onChange(updated)
              }}
              placeholder="Jméno dítěte"
              disabled={readOnly}
              className="h-8 text-sm flex-1"
            />
            <Input
              value={child.birth_number}
              onChange={(e) => {
                const updated = [...children]
                updated[i] = { ...updated[i], birth_number: e.target.value }
                onChange(updated)
              }}
              placeholder="Rodné číslo"
              disabled={readOnly}
              className="h-8 text-sm w-36"
            />
            {!readOnly && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                onClick={() => onChange(children.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange([...children, { name: '', birth_number: '' }])}
          >
            <Plus className="h-3 w-3 mr-1" />
            Přidat dítě
          </Button>
        )}
      </div>
    )
  }

  return null
}

// --- Hint Icon (tooltip on hover) ---

function HintIcon({ hint }: { hint: string }) {
  return (
    <div className="relative group inline-flex">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-64 bg-popover text-popover-foreground text-xs rounded-md p-2.5 shadow-md border z-20 leading-relaxed">
        {hint}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
      </div>
    </div>
  )
}

// --- Required Documents Checklist (BOD-072) ---

const REQUIRED_DOCUMENTS = [
  {
    section: '§ 6 Příjmy ze závislé činnosti',
    items: [
      'Potvrzení o zdanitelných příjmech od všech zaměstnavatelů',
      'Potvrzení o vyplacených příjmech a sražené dani (DPP, DPČ)',
      'Zahraniční příjmy: potvrzení od zahraničního správce daně',
      'Evidence Úřad práce: doložení doby evidence',
    ],
  },
  {
    section: '§ 8 Příjmy z kapitálového majetku',
    items: [
      'Podklady z investičních platforem',
      'Potvrzení o příjmech ze zdrojů v zahraničí (podíly na zisku, úroky z CP)',
    ],
  },
  {
    section: '§ 9 Příjmy z pronájmu',
    items: [
      'Skutečné výdaje: výše příjmů a výdajů',
      'Paušální výdaje: výše příjmů (nájemné BEZ záloh, pokud nejsou vyúčtovány)',
    ],
  },
  {
    section: '§ 10 Ostatní příjmy',
    items: [
      'Prodej cenných papírů, nemovitostí, příležitostné příjmy — podklady',
    ],
  },
  {
    section: 'Nezdanitelné části daně',
    items: [
      'Doklad o poskytnutém daru',
      'Potvrzení o hypotéčních úrocích (1. rok: + kopie smlouvy)',
      'Potvrzení o penzijním pojištění / DIP',
      'Potvrzení o životním pojištění',
    ],
  },
  {
    section: 'Daňové zvýhodnění na děti',
    items: [
      'Potvrzení druhého rodiče, že neuplatňuje',
      'Potvrzení o studiu (od 18 let)',
    ],
  },
  {
    section: 'Slevy na dani',
    items: [
      'Sleva na manželku: čestné prohlášení (max příjmy 68 000 Kč + péče o dítě do 3 let)',
      'Sleva na invaliditu: potvrzení',
    ],
  },
  {
    section: 'SP a ZP u OSVČ',
    items: [
      'Info o zdravotní pojišťovně',
      'Potvrzení o zaplacených zálohách na SP (ePortál ČSSZ)',
      'Přehled záloh ZP (portál zdravotní pojišťovny)',
    ],
  },
  {
    section: 'Příjmy ze zahraničí',
    items: [
      'Potvrzení zahraničního správce daně',
      'Podklady pro určení daňové rezidence (délka pobytu, rodina, aktivity)',
    ],
  },
]

function RequiredDocumentsChecklist() {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <FileCheck className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <span className="font-medium text-sm">Požadované podklady pro DPFO</span>
            <span className="text-xs text-muted-foreground ml-2">
              {REQUIRED_DOCUMENTS.reduce((sum, s) => sum + s.items.length, 0)} položek
            </span>
          </div>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-4">
          <p className="text-xs text-muted-foreground mb-4">
            Připravte si tyto dokumenty podle toho, které se vás týkají. Nemusíte doložit vše — jen to, co odpovídá vašim příjmům a situaci.
          </p>
          <div className="space-y-4">
            {REQUIRED_DOCUMENTS.map((group) => (
              <div key={group.section}>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {group.section}
                </h4>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
