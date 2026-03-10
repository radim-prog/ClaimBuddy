'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  HelpCircle,
  ListChecks,
  Zap,
  Users,
  CalendarDays,
  Trophy,
  Plus,
  X,
  Trash2,
  BookMarked,
  Archive,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ScoringWizard } from './scoring-wizard'
import { GTDFlowDiagram } from './gtd-flow-diagram'
import { fireTaskConfetti, fireInboxClearedConfetti } from './confetti'

type Company = {
  id: string
  name: string
}

type GTDStep = 'capture' | 'clarify' | 'define' | 'twominute' | 'delegate' | 'schedule' | 'score'

const STEPS: GTDStep[] = ['capture', 'clarify', 'define', 'twominute', 'delegate', 'schedule', 'score']

const STEP_LABELS: Record<GTDStep, string> = {
  capture: 'Zachycení',
  clarify: 'Je to řešitelné?',
  define: 'Definice',
  twominute: '2minutové pravidlo',
  delegate: 'Delegování',
  schedule: 'Plánování',
  score: 'Ohodnocení',
}

const STEP_ICONS: Record<GTDStep, typeof Lightbulb> = {
  capture: Lightbulb,
  clarify: HelpCircle,
  define: ListChecks,
  twominute: Zap,
  delegate: Users,
  schedule: CalendarDays,
  score: Trophy,
}

const CONTEXTS = [
  { value: '@telefon', label: 'Telefon' },
  { value: '@email', label: 'Email' },
  { value: '@počítač', label: 'Počítač' },
  { value: '@klient', label: 'U klienta' },
  { value: '@kancelář', label: 'Kancelář' },
]

const TIME_PRESETS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hod' },
  { value: 120, label: '2 hod' },
  { value: 240, label: '4 hod' },
  { value: 480, label: 'Celý den' },
]

export function GTDCaptureFlow() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<GTDStep>('capture')
  const [submitting, setSubmitting] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([])
  const [useQuickPriority, setUseQuickPriority] = useState(false)

  // Form data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('')

  // Clarify
  const [isActionable, setIsActionable] = useState<boolean | null>(null)
  const [nonActionableChoice, setNonActionableChoice] = useState<'someday' | 'reference' | 'delete' | null>(null)

  // Define
  const [isMultiStep, setIsMultiStep] = useState<boolean | null>(null)
  const [projectOutcome, setProjectOutcome] = useState('')
  const [subtasks, setSubtasks] = useState<string[]>([''])

  // Two-minute rule
  const [isQuickAction, setIsQuickAction] = useState<boolean | null>(null)

  // Delegate
  const [shouldDelegate, setShouldDelegate] = useState<boolean | null>(null)
  const [delegateTo, setDelegateTo] = useState('')
  const [delegateToName, setDelegateToName] = useState('')

  // Schedule
  const [dueDate, setDueDate] = useState('')
  const [contexts, setContexts] = useState<string[]>([])
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low' | ''>('')
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)
  const [billingType, setBillingType] = useState<'tariff' | 'extra' | 'free'>('tariff')

  // Score
  const [quickPriority, setQuickPriority] = useState<'high' | 'medium' | 'low' | null>(null)
  const [scores, setScores] = useState<{
    score_money: number
    score_fire: number
    score_time: number
    score_distance: number
    score_personal: number
    total_score: number
    priority: 'high' | 'medium' | 'low'
  } | null>(null)

  // Load companies
  useEffect(() => {
    fetch('/api/accountant/companies')
      .then(r => r.json())
      .then(data => setCompanies(data.companies || []))
      .catch(() => {})
  }, [])

  // Load team members
  useEffect(() => {
    fetch('/api/accountant/users')
      .then(r => r.json())
      .then(data => setTeamMembers(data.users || []))
      .catch(() => {})
  }, [])

  const currentStepIndex = STEPS.indexOf(currentStep)

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(currentStep)
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1])
    }
  }, [currentStep])

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(currentStep)
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1])
    }
  }, [currentStep])

  const goToStep = useCallback((step: GTDStep) => {
    const targetIdx = STEPS.indexOf(step)
    if (targetIdx <= currentStepIndex) {
      setCurrentStep(step)
    }
  }, [currentStepIndex])

  // Handle non-actionable items
  const handleNonActionable = async (choice: 'someday' | 'reference' | 'delete') => {
    setNonActionableChoice(choice)

    if (choice === 'delete') {
      toast.info('Položka smazána')
      router.push('/accountant/work')
      return
    }

    setSubmitting(true)
    try {
      const status = choice === 'someday' ? 'someday_maybe' : 'cancelled'
      const tags = choice === 'reference' ? ['reference'] : []

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          status,
          company_id: companyId || undefined,
          company_name: companyName || undefined,
          tags,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(choice === 'someday' ? 'Uloženo do Someday/Maybe' : 'Uloženo jako reference')
      router.push('/accountant/work')
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle quick action (do it now)
  const handleDoItNow = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          status: 'completed',
          company_id: companyId || undefined,
          company_name: companyName || undefined,
          gtd_is_quick_action: true,
          completed_at: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error()
      fireTaskConfetti()
      toast.success('Hotovo! Skvělá práce!')
      router.push('/accountant/work')
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSubmitting(false)
    }
  }

  // Final submit
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const isProject = isMultiStep === true

      if (isProject) {
        // Create GTD task-project (is_project=true in tasks table)
        const priority = quickPriority || scores?.priority || 'medium'
        const totalScore = scores?.total_score ?? (quickPriority === 'high' ? 10 : quickPriority === 'medium' ? 7 : 3)

        const projectRes = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: description || undefined,
            is_project: true,
            project_outcome: projectOutcome || undefined,
            status: 'in_progress',
            company_id: companyId || undefined,
            company_name: companyName || undefined,
            due_date: dueDate || undefined,
            estimated_minutes: estimatedMinutes || undefined,
            gtd_context: contexts.length > 0 ? contexts : undefined,
            gtd_energy_level: energyLevel || undefined,
            score_money: scores?.score_money,
            score_fire: scores?.score_fire,
            score_time: scores?.score_time,
            score_distance: scores?.score_distance,
            score_personal: scores?.score_personal,
            total_score: totalScore,
            priority,
          }),
        })
        if (!projectRes.ok) throw new Error()
        const projectData = await projectRes.json()
        const projectId = projectData.task?.id

        // Create subtasks with parent_project_id
        if (projectId && subtasks.filter(s => s.trim()).length > 0) {
          for (let i = 0; i < subtasks.length; i++) {
            if (!subtasks[i].trim()) continue
            await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: subtasks[i].trim(),
                status: shouldDelegate ? 'waiting_for' : 'pending',
                parent_project_id: projectId,
                company_id: companyId || undefined,
                company_name: companyName || undefined,
                assigned_to: delegateTo || undefined,
                assigned_to_name: delegateToName || undefined,
                is_next_action: i === 0,
                position_in_phase: i,
                due_date: dueDate || undefined,
                gtd_context: contexts.length > 0 ? contexts : undefined,
                gtd_energy_level: energyLevel || undefined,
                estimated_minutes: estimatedMinutes || undefined,
                billing_type: billingType,
              }),
            })
          }
        }

        fireInboxClearedConfetti()
        toast.success('Projekt vytvořen!')
        router.push(`/accountant/tasks/${projectId}`)
      } else {
        // Create single task
        const priority = quickPriority || scores?.priority || 'medium'
        const totalScore = scores?.total_score ?? (quickPriority === 'high' ? 10 : quickPriority === 'medium' ? 7 : 3)

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: description || undefined,
            status: shouldDelegate ? 'waiting_for' : 'pending',
            company_id: companyId || undefined,
            company_name: companyName || undefined,
            assigned_to: delegateTo || undefined,
            assigned_to_name: delegateToName || undefined,
            is_waiting_for: shouldDelegate || false,
            waiting_for_who: delegateToName || undefined,
            due_date: dueDate || undefined,
            gtd_context: contexts.length > 0 ? contexts : undefined,
            gtd_energy_level: energyLevel || undefined,
            estimated_minutes: estimatedMinutes || undefined,
            billing_type: billingType,
            score_money: scores?.score_money,
            score_fire: scores?.score_fire,
            score_time: scores?.score_time,
            score_distance: scores?.score_distance,
            score_personal: scores?.score_personal,
            total_score: totalScore,
            priority,
          }),
        })
        if (!res.ok) throw new Error()

        fireTaskConfetti()
        toast.success('Úkol vytvořen!')
        router.push('/accountant/work')
      }
    } catch {
      toast.error('Chyba při vytváření')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompanyChange = (id: string) => {
    setCompanyId(id)
    const comp = companies.find(c => c.id === id)
    setCompanyName(comp?.name || '')
  }

  const addSubtask = () => setSubtasks(prev => [...prev, ''])
  const removeSubtask = (i: number) => setSubtasks(prev => prev.filter((_, idx) => idx !== i))
  const updateSubtask = (i: number, val: string) => setSubtasks(prev => prev.map((s, idx) => idx === i ? val : s))

  const toggleContext = (ctx: string) => {
    setContexts(prev => prev.includes(ctx) ? prev.filter(c => c !== ctx) : [...prev, ctx])
  }

  // Render steps
  const renderStep = () => {
    switch (currentStep) {
      case 'capture':
        return (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold font-display">Co ti přišlo na mysl?</h2>
              <p className="text-sm text-muted-foreground mt-1">Zachyť myšlenku — název stačí</p>
            </div>

            <div className="space-y-2">
              <Label>Název *</Label>
              <Input
                placeholder="Např. Připravit uzávěrku pro Novák s.r.o."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="text-lg h-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) {
                    e.preventDefault()
                    goNext()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Popis <span className="text-muted-foreground text-xs">(volitelný)</span></Label>
              <Textarea
                placeholder="Další detaily..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Klient / firma <span className="text-muted-foreground text-xs">(volitelný)</span></Label>
              <Select value={companyId} onValueChange={handleCompanyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte firmu" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={goNext}
              disabled={!title.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 h-11"
              size="lg"
            >
              Pokračovat <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )

      case 'clarify':
        return (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                <HelpCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold font-display">Je to řešitelné?</h2>
              <p className="text-sm text-muted-foreground mt-1">Vyžaduje &quot;{title}&quot; nějakou akci?</p>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => { setIsActionable(true); goNext() }}
                className="w-full text-left p-4 rounded-xl border-2 transition-all hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-semibold">Ano, je to řešitelné</div>
                    <div className="text-sm text-muted-foreground">Vyžaduje to konkrétní akci</div>
                  </div>
                </div>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">nebo</span></div>
              </div>

              <button
                onClick={() => handleNonActionable('someday')}
                disabled={submitting}
                className="w-full text-left p-4 rounded-xl border-2 transition-all hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl"><Archive className="h-6 w-6 text-purple-500" /></span>
                  <div>
                    <div className="font-semibold">Someday / Maybe</div>
                    <div className="text-sm text-muted-foreground">Možná někdy v budoucnu</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleNonActionable('reference')}
                disabled={submitting}
                className="w-full text-left p-4 rounded-xl border-2 transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl"><BookMarked className="h-6 w-6 text-blue-500" /></span>
                  <div>
                    <div className="font-semibold">Pro informaci (reference)</div>
                    <div className="text-sm text-muted-foreground">Uložit jako spisovou značku</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleNonActionable('delete')}
                disabled={submitting}
                className="w-full text-left p-4 rounded-xl border-2 transition-all hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl"><Trash2 className="h-6 w-6 text-red-500" /></span>
                  <div>
                    <div className="font-semibold">Smazat</div>
                    <div className="text-sm text-muted-foreground">Nepotřebuji to</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )

      case 'define':
        return (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                <ListChecks className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold font-display">Jeden krok nebo víc?</h2>
              <p className="text-sm text-muted-foreground mt-1">Rozhodne se automaticky, zda jde o úkol nebo projekt</p>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => { setIsMultiStep(false); goNext() }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                  isMultiStep === false ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <div className="font-semibold">Jeden krok</div>
                    <div className="text-sm text-muted-foreground">Jednoduchý úkol — stačí jedna akce</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setIsMultiStep(true)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                  isMultiStep === true ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📁</span>
                  <div>
                    <div className="font-semibold">Více kroků → Projekt</div>
                    <div className="text-sm text-muted-foreground">Potřebuji rozdělit na dílčí úkoly</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Project details */}
            {isMultiStep && (
              <div className="space-y-4 pt-4 border-t animate-in fade-in duration-200">
                <div className="space-y-2">
                  <Label>Cíl projektu (desired outcome)</Label>
                  <Input
                    placeholder="Jak bude vypadat hotový výsledek?"
                    value={projectOutcome}
                    onChange={(e) => setProjectOutcome(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kroky (úkoly projektu)</Label>
                  <div className="space-y-2">
                    {subtasks.map((st, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-sm text-muted-foreground mt-2.5 w-5 text-right flex-shrink-0">{i + 1}.</span>
                        <Input
                          placeholder={`Krok ${i + 1}`}
                          value={st}
                          onChange={(e) => updateSubtask(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSubtask()
                            }
                          }}
                        />
                        {subtasks.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeSubtask(i)} className="flex-shrink-0">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addSubtask}>
                    <Plus className="h-3 w-3 mr-1" /> Přidat krok
                  </Button>
                </div>

                <Button
                  onClick={goNext}
                  className="w-full bg-purple-600 hover:bg-purple-700 h-11"
                >
                  Pokračovat <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )

      case 'twominute':
        return (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-3">
                <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-xl font-semibold font-display">Pravidlo 2 minut</h2>
              <p className="text-sm text-muted-foreground mt-1">Dá se to zvládnout za méně než 2 minuty?</p>
            </div>

            <div className="grid gap-3">
              <button
                onClick={handleDoItNow}
                disabled={submitting}
                className="w-full text-left p-4 rounded-xl border-2 transition-all hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-semibold">Ano! Udělám to hned</div>
                    <div className="text-sm text-muted-foreground">Označí se jako dokončené</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setIsQuickAction(false); goNext() }}
                className="w-full text-left p-4 rounded-xl border-2 transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <div className="font-semibold">Ne, zabere to víc času</div>
                    <div className="text-sm text-muted-foreground">Naplánuji to později</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )

      case 'delegate':
        return (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-3">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold font-display">Měl by to dělat někdo jiný?</h2>
              <p className="text-sm text-muted-foreground mt-1">Delegování je efektivní — nechej pracovat tým</p>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => { setShouldDelegate(false); goNext() }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 ${
                  shouldDelegate === false ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🙋</span>
                  <div>
                    <div className="font-semibold">Udělám to sám/a</div>
                    <div className="text-sm text-muted-foreground">Jsem na to správná osoba</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShouldDelegate(true)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${
                  shouldDelegate === true ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <div className="font-semibold">Delegovat na někoho jiného</div>
                    <div className="text-sm text-muted-foreground">Přiřadit kolegovi/kolegyni</div>
                  </div>
                </div>
              </button>
            </div>

            {shouldDelegate && (
              <div className="space-y-3 pt-4 border-t animate-in fade-in duration-200">
                <Label>Komu delegovat?</Label>
                <Select value={delegateTo} onValueChange={(id) => {
                  setDelegateTo(id)
                  const m = teamMembers.find(tm => tm.id === id)
                  setDelegateToName(m?.name || '')
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte osobu" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={goNext}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Pokračovat <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )

      case 'schedule':
        return (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 mb-3">
                <CalendarDays className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-semibold font-display">Kdy a jak?</h2>
              <p className="text-sm text-muted-foreground mt-1">Naplánuj termín, kontext a odhad</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Termín dokončení</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Kontext</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTEXTS.map(ctx => (
                    <button
                      key={ctx.value}
                      onClick={() => toggleContext(ctx.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        contexts.includes(ctx.value)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {ctx.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Energie</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'high' as const, label: 'Vysoká', emoji: '🔥' },
                    { value: 'medium' as const, label: 'Střední', emoji: '⚡' },
                    { value: 'low' as const, label: 'Nízká', emoji: '☕' },
                  ].map(e => (
                    <button
                      key={e.value}
                      onClick={() => setEnergyLevel(energyLevel === e.value ? '' : e.value)}
                      className={`p-2.5 rounded-lg border-2 text-center text-sm transition-all ${
                        energyLevel === e.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{e.emoji}</span>
                      <div className="font-medium mt-0.5">{e.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Odhad času</Label>
                <div className="flex flex-wrap gap-2">
                  {TIME_PRESETS.map(tp => (
                    <button
                      key={tp.value}
                      onClick={() => setEstimatedMinutes(estimatedMinutes === tp.value ? null : tp.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        estimatedMinutes === tp.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Typ fakturace</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'tariff' as const, label: 'Paušál', emoji: '📦' },
                    { value: 'extra' as const, label: 'Zvlášť', emoji: '💰' },
                    { value: 'free' as const, label: 'Zdarma', emoji: '🎁' },
                  ].map(bt => (
                    <button
                      key={bt.value}
                      onClick={() => setBillingType(bt.value)}
                      className={`p-2.5 rounded-lg border-2 text-center text-sm transition-all ${
                        billingType === bt.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{bt.emoji}</span>
                      <div className="font-medium mt-0.5">{bt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={goNext}
              className="w-full bg-purple-600 hover:bg-purple-700 h-11"
              size="lg"
            >
              Pokračovat k ohodnocení <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )

      case 'score':
        return (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-3">
                <Trophy className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold font-display">Ohodnocení priority</h2>
              <p className="text-sm text-muted-foreground mt-1">Jak důležité je to?</p>
            </div>

            {/* Quick priority or R-Tasks toggle */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <button
                onClick={() => { setUseQuickPriority(true); setScores(null) }}
                className={`px-4 py-2 rounded-lg transition-all ${
                  useQuickPriority ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                Rychlá priorita
              </button>
              <button
                onClick={() => { setUseQuickPriority(false); setQuickPriority(null) }}
                className={`px-4 py-2 rounded-lg transition-all ${
                  !useQuickPriority ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                R-Tasks wizard
              </button>
            </div>

            {useQuickPriority ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'high' as const, label: 'Vysoká', emoji: '🔴', color: 'border-red-500 bg-red-50 dark:bg-red-900/20' },
                    { value: 'medium' as const, label: 'Střední', emoji: '🟡', color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
                    { value: 'low' as const, label: 'Nízká', emoji: '🟢', color: 'border-green-500 bg-green-50 dark:bg-green-900/20' },
                  ].map(p => (
                    <button
                      key={p.value}
                      onClick={() => setQuickPriority(p.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        quickPriority === p.value ? p.color : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-3xl">{p.emoji}</span>
                      <div className="font-semibold mt-2">{p.label}</div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!quickPriority || submitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base"
                  size="lg"
                >
                  {submitting ? 'Vytvářím...' : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {isMultiStep ? 'Vytvořit projekt' : 'Vytvořit úkol'}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div>
                <ScoringWizard
                  onComplete={(result) => {
                    setScores(result)
                    handleSubmit()
                  }}
                  onCancel={() => setUseQuickPriority(true)}
                />
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        {/* Left sidebar - GTD Flow Diagram (desktop) */}
        <div className="hidden md:block">
          <div className="sticky top-6">
            <GTDFlowDiagram
              currentStep={currentStep}
              completedSteps={STEPS.slice(0, currentStepIndex)}
              onStepClick={goToStep}
            />
          </div>
        </div>

        {/* Main content */}
        <div>
          {/* Progress bar (mobile) */}
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{STEP_LABELS[currentStep]}</span>
              <span className="text-sm text-muted-foreground">Krok {currentStepIndex + 1} z {STEPS.length}</span>
            </div>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < currentStepIndex ? 'bg-purple-600' : i === currentStepIndex ? 'bg-purple-400' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Back button */}
          {currentStepIndex > 0 && (
            <Button variant="ghost" size="sm" onClick={goBack} className="mb-3">
              <ArrowLeft className="h-4 w-4 mr-1" /> Zpět
            </Button>
          )}

          {/* Step content */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 pb-8 px-6">
              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
