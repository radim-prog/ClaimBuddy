'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Building2,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useCachedFetch } from '@/lib/hooks/use-cached-fetch'
import type { InsuranceType, CasePriority, InsuranceCompany } from '@/lib/types/insurance'
import { insuranceTypeLabel, priorityLabel } from '@/lib/types/insurance'

// --------------- Types ---------------

interface Company {
  id: string
  name: string
  ico: string | null
}

interface FormData {
  // Krok 1 — Klient
  company_id?: string
  new_client_name?: string
  new_client_ico?: string
  contact_person?: string
  contact_phone?: string
  // Krok 2 — Pojištění
  insurance_type: InsuranceType
  insurance_company_id?: string
  policy_number?: string
  claim_number?: string
  // Krok 3 — Událost
  event_date?: string
  event_location?: string
  event_description?: string
  claimed_amount?: number
  priority: CasePriority
  deadline?: string
  note?: string
}

// --------------- Constants ---------------

const INSURANCE_TYPES: InsuranceType[] = [
  'auto',
  'property',
  'life',
  'liability',
  'travel',
  'industrial',
  'other',
]

const PRIORITIES: CasePriority[] = ['low', 'normal', 'high', 'urgent']

const STEPS = [
  { label: 'Klient', icon: User },
  { label: 'Pojištění', icon: Shield },
  { label: 'Událost', icon: AlertTriangle },
  { label: 'Souhrn', icon: CheckCircle },
]

// --------------- Helpers ---------------

function formatCurrency(value?: number): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(value)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// --------------- Sub-components ---------------

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep
        const Icon = step.icon

        return (
          <div key={stepNum} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center transition-colors border-2
                  ${isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                  isCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 mt-[-14px] transition-colors ${
                  stepNum < currentStep ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// --------------- Validation ---------------

function validateStep(step: number, formData: FormData): string | null {
  if (step === 1) {
    const hasExisting = !!formData.company_id
    const hasNew = !!(formData.new_client_name?.trim())
    if (!hasExisting && !hasNew) {
      return 'Vyberte existujícího klienta nebo zadejte jméno nového klienta.'
    }
  }
  if (step === 2) {
    if (!formData.insurance_type) {
      return 'Vyberte typ pojištění.'
    }
  }
  if (step === 3) {
    if (!formData.event_date) {
      return 'Zadejte datum události.'
    }
    if (!formData.event_description?.trim() || formData.event_description.trim().length < 10) {
      return 'Popis události musí mít alespoň 10 znaků.'
    }
  }
  return null
}

// --------------- Main component ---------------

export default function NewCasePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    insurance_type: 'other',
    priority: 'normal',
  })
  const [submitting, setSubmitting] = useState(false)
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Fetch companies
  const { data: companiesData, loading: loadingCompanies } = useCachedFetch<{ companies: Company[] }>(
    'companies-list',
    () => fetch('/api/accountant/companies').then(r => r.json())
  )
  const companies = companiesData?.companies ?? []

  // Fetch insurance companies
  const { data: insCompaniesData, loading: loadingInsCompanies } = useCachedFetch<{ companies: InsuranceCompany[] }>(
    'insurance-companies',
    () => fetch('/api/claims/companies').then(r => r.json())
  )
  const insuranceCompanies = insCompaniesData?.companies ?? []

  // --------------- Handlers ---------------

  const update = (patch: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...patch }))
    setValidationError(null)
  }

  const handleNext = () => {
    const err = validateStep(step, formData)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setValidationError(null)
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        insurance_type: formData.insurance_type,
        priority: formData.priority,
      }

      if (clientMode === 'existing' && formData.company_id) {
        payload.company_id = formData.company_id
      } else if (clientMode === 'new') {
        payload.new_client_name = formData.new_client_name
        payload.new_client_ico = formData.new_client_ico
      }

      if (formData.contact_person) payload.contact_person = formData.contact_person
      if (formData.contact_phone) payload.contact_phone = formData.contact_phone
      if (formData.insurance_company_id) payload.insurance_company_id = formData.insurance_company_id
      if (formData.policy_number) payload.policy_number = formData.policy_number
      if (formData.claim_number) payload.claim_number = formData.claim_number
      if (formData.event_date) payload.event_date = formData.event_date
      if (formData.event_location) payload.event_location = formData.event_location
      if (formData.event_description) payload.event_description = formData.event_description
      if (formData.claimed_amount != null) payload.claimed_amount = formData.claimed_amount
      if (formData.deadline) payload.deadline = formData.deadline
      if (formData.note) payload.note = formData.note

      const res = await fetch('/api/claims/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se vytvořit spis')
      }

      const data = await res.json()
      toast.success('Spis byl úspěšně vytvořen')
      router.push(`/claims/cases/${data.id || data.case?.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se vytvořit spis'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // --------------- Derived display helpers ---------------

  const selectedCompany = companies.find(c => c.id === formData.company_id)
  const selectedInsuranceCompany = insuranceCompanies.find(c => c.id === formData.insurance_company_id)

  const clientDisplay = clientMode === 'existing'
    ? (selectedCompany?.name ?? '—')
    : (formData.new_client_name?.trim() || '—')

  // --------------- Render ---------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/claims/cases')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na seznam spisů
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Nový pojistný spis</h1>
          <p className="text-muted-foreground mt-1 text-sm">Vyplňte informace pro vytvoření nového pojistného případu</p>
        </div>

        {/* Progress bar */}
        <ProgressBar currentStep={step} />

        {/* ============ STEP 1 — Klient ============ */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Krok 1: Klient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Mode toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => { setClientMode('existing'); update({ new_client_name: undefined, new_client_ico: undefined }) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                    clientMode === 'existing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Existující klient
                </button>
                <button
                  onClick={() => { setClientMode('new'); update({ company_id: undefined }) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                    clientMode === 'new'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-900 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Nový klient
                </button>
              </div>

              {/* Existing client */}
              {clientMode === 'existing' && (
                <div className="space-y-2">
                  <Label htmlFor="company-select">Klient *</Label>
                  {loadingCompanies ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Načítání klientů...
                    </div>
                  ) : (
                    <Select
                      value={formData.company_id ?? ''}
                      onValueChange={v => update({ company_id: v || undefined })}
                    >
                      <SelectTrigger id="company-select">
                        <SelectValue placeholder="Vyberte klienta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}{c.ico ? ` (IČO: ${c.ico})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* New client */}
              {clientMode === 'new' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="new-client-name">Jméno / Název firmy *</Label>
                      <Input
                        id="new-client-name"
                        value={formData.new_client_name ?? ''}
                        onChange={e => update({ new_client_name: e.target.value || undefined })}
                        placeholder="např. Jan Novák nebo Firma s.r.o."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-client-ico">IČO</Label>
                      <Input
                        id="new-client-ico"
                        value={formData.new_client_ico ?? ''}
                        onChange={e => update({ new_client_ico: e.target.value || undefined })}
                        placeholder="12345678"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-md">
                    Nový klient nebude automaticky přidán do systému. Údaje se uloží pouze k tomuto spisu.
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t pt-4 space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Kontaktní osoba (volitelné)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-person">Jméno kontaktní osoby</Label>
                    <Input
                      id="contact-person"
                      value={formData.contact_person ?? ''}
                      onChange={e => update({ contact_person: e.target.value || undefined })}
                      placeholder="např. Jana Nováková"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Telefon kontaktní osoby</Label>
                    <Input
                      id="contact-phone"
                      value={formData.contact_phone ?? ''}
                      onChange={e => update({ contact_phone: e.target.value || undefined })}
                      placeholder="+420 777 123 456"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ STEP 2 — Pojištění ============ */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                Krok 2: Pojištění
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="insurance-type">Typ pojištění *</Label>
                <Select
                  value={formData.insurance_type}
                  onValueChange={v => update({ insurance_type: v as InsuranceType })}
                >
                  <SelectTrigger id="insurance-type">
                    <SelectValue placeholder="Vyberte typ pojištění..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INSURANCE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {insuranceTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance-company">Pojišťovna</Label>
                {loadingInsCompanies ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Načítání pojišťoven...
                  </div>
                ) : (
                  <Select
                    value={formData.insurance_company_id ?? ''}
                    onValueChange={v => update({ insurance_company_id: v || undefined })}
                  >
                    <SelectTrigger id="insurance-company">
                      <SelectValue placeholder="Vyberte pojišťovnu..." />
                    </SelectTrigger>
                    <SelectContent>
                      {insuranceCompanies.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policy-number">Číslo pojistky</Label>
                  <Input
                    id="policy-number"
                    value={formData.policy_number ?? ''}
                    onChange={e => update({ policy_number: e.target.value || undefined })}
                    placeholder="např. POL-2024-001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claim-number">Číslo škody u pojišťovny</Label>
                  <Input
                    id="claim-number"
                    value={formData.claim_number ?? ''}
                    onChange={e => update({ claim_number: e.target.value || undefined })}
                    placeholder="např. SK-2024-056789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ STEP 3 — Událost ============ */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                Krok 3: Událost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Datum události *</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={formData.event_date ?? ''}
                    onChange={e => update({ event_date: e.target.value || undefined })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-location">Místo události</Label>
                  <Input
                    id="event-location"
                    value={formData.event_location ?? ''}
                    onChange={e => update({ event_location: e.target.value || undefined })}
                    placeholder="např. Praha 2, Vinohrady"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-description">
                  Popis události *
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(min. 10 znaků)</span>
                </Label>
                <Textarea
                  id="event-description"
                  value={formData.event_description ?? ''}
                  onChange={e => update({ event_description: e.target.value || undefined })}
                  placeholder="Popište průběh pojistné události co nejpřesněji..."
                  rows={4}
                  className={
                    formData.event_description && formData.event_description.length < 10
                      ? 'border-red-300 focus-visible:ring-red-400'
                      : ''
                  }
                />
                {formData.event_description && formData.event_description.length < 10 && (
                  <p className="text-xs text-red-500">
                    Ještě {10 - formData.event_description.length} znaků
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimed-amount">Nárokovaná částka (Kč)</Label>
                  <Input
                    id="claimed-amount"
                    type="number"
                    min={0}
                    step={1}
                    value={formData.claimed_amount ?? ''}
                    onChange={e => update({ claimed_amount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorita</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={v => update({ priority: v as CasePriority })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p} value={p}>
                          {priorityLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (volitelné)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline ?? ''}
                  onChange={e => update({ deadline: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Poznámka (volitelné)</Label>
                <Textarea
                  id="note"
                  value={formData.note ?? ''}
                  onChange={e => update({ note: e.target.value || undefined })}
                  placeholder="Interní poznámka k případu..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ STEP 4 — Souhrn ============ */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Klient */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-blue-600" />
                  Klient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <SummaryRow label="Klient" value={clientDisplay} />
                {clientMode === 'new' && formData.new_client_ico && (
                  <SummaryRow label="IČO" value={formData.new_client_ico} />
                )}
                {formData.contact_person && (
                  <SummaryRow label="Kontaktní osoba" value={formData.contact_person} />
                )}
                {formData.contact_phone && (
                  <SummaryRow label="Telefon" value={formData.contact_phone} />
                )}
              </CardContent>
            </Card>

            {/* Pojištění */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Pojištění
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <SummaryRow label="Typ pojištění" value={insuranceTypeLabel(formData.insurance_type)} />
                <SummaryRow
                  label="Pojišťovna"
                  value={selectedInsuranceCompany?.name ?? '—'}
                />
                {formData.policy_number && (
                  <SummaryRow label="Číslo pojistky" value={formData.policy_number} />
                )}
                {formData.claim_number && (
                  <SummaryRow label="Číslo škody" value={formData.claim_number} />
                )}
              </CardContent>
            </Card>

            {/* Událost */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  Událost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <SummaryRow label="Datum události" value={formatDate(formData.event_date)} />
                {formData.event_location && (
                  <SummaryRow label="Místo události" value={formData.event_location} />
                )}
                <div className="flex gap-2 py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground min-w-[160px]">Popis události</span>
                  <span className="text-foreground flex-1 leading-relaxed">{formData.event_description}</span>
                </div>
                {formData.claimed_amount != null && (
                  <SummaryRow label="Nárokovaná částka" value={formatCurrency(formData.claimed_amount)} />
                )}
                <SummaryRow label="Priorita" value={priorityLabel(formData.priority)} />
                {formData.deadline && (
                  <SummaryRow label="Deadline" value={formatDate(formData.deadline)} />
                )}
                {formData.note && (
                  <div className="flex gap-2 py-1.5 border-b last:border-0">
                    <span className="text-muted-foreground min-w-[160px]">Poznámka</span>
                    <span className="text-foreground flex-1 leading-relaxed">{formData.note}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============ Validation error ============ */}
        {validationError && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {validationError}
          </div>
        )}

        {/* ============ Navigation ============ */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {step === 1 ? (
              <Button
                variant="outline"
                onClick={() => router.push('/claims/cases')}
              >
                Zrušit
              </Button>
            ) : (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zpět
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Krok {step} z {STEPS.length}
            </span>
            {step < STEPS.length ? (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
                Další
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vytváření...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Vytvořit spis
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// --------------- Summary row helper ---------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-1.5 border-b last:border-0">
      <span className="text-muted-foreground min-w-[160px] flex-shrink-0">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}
