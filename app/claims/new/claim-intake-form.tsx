'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Car,
  Home,
  Heart,
  Shield,
  Plane,
  Factory,
  HelpCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Search,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Building2,
  ClipboardList,
  Eye,
} from 'lucide-react'
import type { InsuranceType } from '@/lib/types/insurance'
import { insuranceTypeLabel } from '@/lib/types/insurance'

// --------------- Types ---------------

interface InsuranceCompanyPublic {
  id: string
  name: string
  logo_path: string | null
}

interface IntakeFormData {
  insurance_type: InsuranceType | ''
  insurance_company_id: string
  custom_company_name: string
  event_date: string
  event_location: string
  event_description: string
  estimated_damage: string
  contact_name: string
  contact_email: string
  contact_phone: string
  gdpr_consent: boolean
}

// --------------- Constants ---------------

const INSURANCE_TYPE_CARDS: { type: InsuranceType; label: string; icon: typeof Car; color: string }[] = [
  { type: 'auto', label: 'Autopojištění', icon: Car, color: 'text-blue-600 dark:text-blue-400' },
  { type: 'property', label: 'Pojištění majetku', icon: Home, color: 'text-emerald-600 dark:text-emerald-400' },
  { type: 'life', label: 'Životní pojištění', icon: Heart, color: 'text-rose-600 dark:text-rose-400' },
  { type: 'liability', label: 'Odpovědnost', icon: Shield, color: 'text-purple-600 dark:text-purple-400' },
  { type: 'travel', label: 'Cestovní', icon: Plane, color: 'text-sky-600 dark:text-sky-400' },
  { type: 'industrial', label: 'Průmyslové', icon: Factory, color: 'text-amber-600 dark:text-amber-400' },
  { type: 'other', label: 'Jiné', icon: HelpCircle, color: 'text-gray-600 dark:text-gray-400' },
]

const STEPS = [
  { label: 'Typ', icon: Shield },
  { label: 'Pojišťovna', icon: Building2 },
  { label: 'Detail', icon: ClipboardList },
  { label: 'Dokumenty', icon: FileText },
  { label: 'Kontakt', icon: User },
  { label: 'Souhrn', icon: Eye },
]

const MAX_FILES = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.heic,.pdf,.docx'

// --------------- Helpers ---------------

function formatCurrency(value: string): string {
  const n = Number(value)
  if (!value || isNaN(n)) return ''
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// --------------- Main Component ---------------

export function ClaimIntakeForm() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [caseNumber, setCaseNumber] = useState('')
  const [formData, setFormData] = useState<IntakeFormData>({
    insurance_type: '',
    insurance_company_id: '',
    custom_company_name: '',
    event_date: '',
    event_location: '',
    event_description: '',
    estimated_damage: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    gdpr_consent: false,
  })
  const [files, setFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)

  // Insurance companies
  const [companies, setCompanies] = useState<InsuranceCompanyPublic[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [useCustomCompany, setUseCustomCompany] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch insurance companies
  useEffect(() => {
    setCompaniesLoading(true)
    fetch('/api/claims/companies')
      .then(r => r.json())
      .then(data => setCompanies(data.companies ?? []))
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false))
  }, [])

  // Generate file previews
  useEffect(() => {
    const previews: Record<string, string> = {}
    const urls: string[] = []

    files.forEach(file => {
      if (isImageFile(file)) {
        const url = URL.createObjectURL(file)
        previews[file.name + file.size] = url
        urls.push(url)
      }
    })

    setFilePreviews(previews)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [files])

  // Update form
  const update = useCallback((patch: Partial<IntakeFormData>) => {
    setFormData(prev => ({ ...prev, ...patch }))
    setError('')
  }, [])

  // Step transition animation
  const goToStep = useCallback((target: number) => {
    const currentStep = step
    setDirection(target > currentStep ? 'forward' : 'back')
    setAnimating(true)
    setTimeout(() => {
      setStep(target)
      setAnimating(false)
    }, 150)
  }, [step])

  // Validation
  const validateStep = useCallback((s: number): string | null => {
    switch (s) {
      case 1:
        if (!formData.insurance_type) return 'Vyberte typ pojištění.'
        break
      case 2:
        if (!formData.insurance_company_id && !formData.custom_company_name.trim()) {
          return 'Vyberte pojišťovnu nebo zadejte název jiné pojišťovny.'
        }
        break
      case 3:
        if (!formData.event_date) return 'Zadejte datum události.'
        if (!formData.event_description.trim() || formData.event_description.trim().length < 20) {
          return 'Popis události musí mít alespoň 20 znaků.'
        }
        break
      case 4:
        // Documents are optional
        break
      case 5:
        if (!formData.contact_name.trim()) return 'Zadejte celé jméno.'
        if (!formData.contact_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
          return 'Zadejte platný email.'
        }
        {
          const phone = formData.contact_phone.replace(/\s+/g, '')
          if (!phone || !/^\+?420\d{9}$/.test(phone)) {
            return 'Zadejte platný český telefon (formát +420 xxx xxx xxx).'
          }
        }
        if (!formData.gdpr_consent) return 'Pro odeslání je nutný souhlas se zpracováním osobních údajů.'
        break
    }
    return null
  }, [formData])

  const handleNext = () => {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError('')
    goToStep(step + 1)
  }

  const handleBack = () => {
    setError('')
    goToStep(step - 1)
  }

  // File handling
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    addFiles(dropped)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    addFiles(Array.from(e.target.files))
    e.target.value = '' // Reset so same file can be selected again
  }

  const addFiles = (newFiles: File[]) => {
    setError('')
    const remaining = MAX_FILES - files.length
    if (remaining <= 0) {
      setError(`Maximální počet souborů je ${MAX_FILES}.`)
      return
    }

    const valid: File[] = []
    for (const file of newFiles.slice(0, remaining)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`Soubor "${file.name}" je příliš velký (max 10 MB).`)
        continue
      }
      valid.push(file)
    }
    if (valid.length) setFiles(prev => [...prev, ...valid])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Submit
  const handleSubmit = async () => {
    const err = validateStep(5)
    if (err) {
      setError(err)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const fd = new FormData()

      // JSON payload
      fd.append('payload', JSON.stringify({
        insurance_type: formData.insurance_type,
        insurance_company_id: formData.insurance_company_id || undefined,
        custom_company_name: formData.custom_company_name || undefined,
        event_date: formData.event_date,
        event_location: formData.event_location || undefined,
        event_description: formData.event_description,
        estimated_damage: formData.estimated_damage || undefined,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        gdpr_consent: formData.gdpr_consent,
      }))

      // Files
      files.forEach((file, i) => {
        fd.append(`file_${i}`, file)
      })

      const res = await fetch('/api/claims/intake', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se odeslat hlášení. Zkuste to prosím znovu.')
      }

      const data = await res.json()
      setCaseNumber(data.case_number || '')
      setSubmitted(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se odeslat hlášení.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Reset
  const handleReset = () => {
    setFormData({
      insurance_type: '',
      insurance_company_id: '',
      custom_company_name: '',
      event_date: '',
      event_location: '',
      event_description: '',
      estimated_damage: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      gdpr_consent: false,
    })
    setFiles([])
    setFilePreviews({})
    setStep(1)
    setSubmitted(false)
    setCaseNumber('')
    setError('')
    setUseCustomCompany(false)
    setCompanySearch('')
  }

  // Filtered companies
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  // Selected company name
  const selectedCompany = companies.find(c => c.id === formData.insurance_company_id)

  // --------------- Success Screen ---------------

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Děkujeme! Vaše hlášení bylo přijato.
        </h2>
        {caseNumber && (
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
            Číslo spisu: {caseNumber}
          </p>
        )}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-8 text-left space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
            <span>
              Ozveme se Vám do 24 hodin na{' '}
              <strong className="text-gray-900 dark:text-white">{formData.contact_email}</strong>.
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
            <span>Na Váš email jsme odeslali potvrzení s detaily hlášení.</span>
          </p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <ClipboardList className="h-4 w-4" />
          Nahlásit další událost
        </button>
      </div>
    )
  }

  // --------------- Wizard ---------------

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Nahlásit pojistnou událost
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
          Vyplňte formulář a my se postaráme o vyřízení Vaší pojistné události. Celý proces zabere jen pár minut.
        </p>
      </div>

      {/* Progress Bar */}
      <ProgressBar currentStep={step} />

      {/* Step content with animation */}
      <div
        className={`transition-all duration-150 ease-in-out ${
          animating
            ? direction === 'forward'
              ? 'opacity-0 translate-x-4'
              : 'opacity-0 -translate-x-4'
            : 'opacity-100 translate-x-0'
        }`}
      >
        {/* ============ STEP 1 — Insurance Type ============ */}
        {step === 1 && (
          <div>
            <StepHeader
              icon={Shield}
              title="Jaký typ pojištění se Vás týká?"
              subtitle="Vyberte kategorii pojištění, ke které se Vaše událost vztahuje."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              {INSURANCE_TYPE_CARDS.map(({ type, label, icon: Icon, color }) => {
                const isSelected = formData.insurance_type === type
                return (
                  <button
                    key={type}
                    onClick={() => {
                      update({ insurance_type: type })
                      setTimeout(() => goToStep(2), 200)
                    }}
                    className={`
                      group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 min-h-[100px]
                      ${isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 shadow-md ring-2 ring-blue-600/20'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                      }
                    `}
                  >
                    <Icon className={`h-8 w-8 ${isSelected ? 'text-blue-600 dark:text-blue-400' : color} transition-colors`} />
                    <span className={`text-sm font-semibold text-center ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ============ STEP 2 — Insurance Company ============ */}
        {step === 2 && (
          <div>
            <StepHeader
              icon={Building2}
              title="U které pojišťovny jste pojištěni?"
              subtitle="Vyberte Vaši pojišťovnu ze seznamu nebo zadejte jinou."
            />
            <div className="mt-6 space-y-4">
              {!useCustomCompany && (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={companySearch}
                      onChange={e => setCompanySearch(e.target.value)}
                      placeholder="Hledat pojišťovnu..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Companies grid */}
                  {companiesLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Načítání pojišťoven...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredCompanies.map(company => {
                        const isSelected = formData.insurance_company_id === company.id
                        return (
                          <button
                            key={company.id}
                            onClick={() => {
                              update({ insurance_company_id: company.id, custom_company_name: '' })
                              setTimeout(() => goToStep(3), 200)
                            }}
                            className={`
                              flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200
                              ${isSelected
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-600/20'
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700'
                              }
                            `}
                          >
                            <Building2 className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                              {company.name}
                            </span>
                            {isSelected && <CheckCircle className="h-4 w-4 text-blue-600 ml-auto flex-shrink-0" />}
                          </button>
                        )
                      })}
                      {filteredCompanies.length === 0 && !companiesLoading && (
                        <p className="col-span-2 text-center text-sm text-gray-400 py-8">
                          Žádná pojišťovna nenalezena.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Custom company toggle */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                {useCustomCompany ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Název pojišťovny
                    </label>
                    <input
                      type="text"
                      value={formData.custom_company_name}
                      onChange={e => update({ custom_company_name: e.target.value, insurance_company_id: '' })}
                      placeholder="Zadejte název pojišťovny..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => { setUseCustomCompany(false); update({ custom_company_name: '' }) }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Zpět na výběr ze seznamu
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setUseCustomCompany(true); update({ insurance_company_id: '' }) }}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Moje pojišťovna není v seznamu
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 3 — Event Details ============ */}
        {step === 3 && (
          <div>
            <StepHeader
              icon={ClipboardList}
              title="Detaily pojistné události"
              subtitle="Popište co se stalo, kdy a kde k události došlo."
            />
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Datum události <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={e => update({ event_date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                {/* Location */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Místo události
                  </label>
                  <input
                    type="text"
                    value={formData.event_location}
                    onChange={e => update({ event_location: e.target.value })}
                    placeholder="např. Praha 5, Smíchov"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                  Popis události <span className="text-red-500">*</span>
                  <span className="ml-auto text-xs font-normal text-gray-400">(min. 20 znaků)</span>
                </label>
                <textarea
                  value={formData.event_description}
                  onChange={e => update({ event_description: e.target.value })}
                  placeholder="Popište co nejpodrobněji, co se stalo, jaké vznikly škody..."
                  rows={5}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm resize-none ${
                    formData.event_description && formData.event_description.trim().length < 20
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
                  }`}
                />
                <div className="flex items-center justify-between">
                  <div>
                    {formData.event_description && formData.event_description.trim().length < 20 && (
                      <p className="text-xs text-red-500">
                        Ještě {20 - formData.event_description.trim().length} znaků
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {formData.event_description.trim().length} / 20 znaků
                  </p>
                </div>
              </div>

              {/* Estimated damage */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Odhadovaná výše škody (Kč)
                  <span className="text-xs font-normal text-gray-400 ml-1">— volitelné</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.estimated_damage}
                  onChange={e => update({ estimated_damage: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 4 — Documents ============ */}
        {step === 4 && (
          <div>
            <StepHeader
              icon={FileText}
              title="Přiložte dokumenty"
              subtitle="Nahrajte fotodokumentaci, policejní protokol, lékařské zprávy apod. Dokumenty můžete přidat i později."
            />
            <div className="mt-6 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Přetáhněte soubory sem nebo <span className="text-blue-600 dark:text-blue-400">klikněte pro výběr</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, HEIC, PDF, DOCX &mdash; max {MAX_FILES} souborů, max 10 MB / soubor
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nahrané soubory ({files.length}/{MAX_FILES})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((file, idx) => {
                      const previewKey = file.name + file.size
                      const preview = filePreviews[previewKey]
                      return (
                        <div
                          key={previewKey + idx}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                        >
                          {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={preview}
                              alt={file.name}
                              className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                              {file.type === 'application/pdf' ? (
                                <FileText className="h-5 w-5 text-red-500" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                          <button
                            onClick={() => removeFile(idx)}
                            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            title="Odebrat soubor"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ STEP 5 — Contact ============ */}
        {step === 5 && (
          <div>
            <StepHeader
              icon={User}
              title="Vaše kontaktní údaje"
              subtitle="Abychom Vás mohli kontaktovat ohledně průběhu vyřizování."
            />
            <div className="mt-6 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <User className="h-4 w-4 text-gray-400" />
                  Celé jméno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={e => update({ contact_name: e.target.value })}
                  placeholder="Jan Novák"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={e => update({ contact_email: e.target.value })}
                  placeholder="jan.novak@email.cz"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {/* Phone */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400" />
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={e => update({ contact_phone: e.target.value })}
                  placeholder="+420 777 123 456"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              {/* GDPR */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.gdpr_consent}
                      onChange={e => update({ gdpr_consent: e.target.checked })}
                      className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Souhlasím se{' '}
                    <a
                      href="/legal/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                    >
                      zpracováním osobních údajů
                    </a>{' '}
                    za účelem vyřízení pojistné události. <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 6 — Summary ============ */}
        {step === 6 && (
          <div>
            <StepHeader
              icon={Eye}
              title="Shrnutí Vašeho hlášení"
              subtitle="Zkontrolujte prosím všechny údaje před odesláním."
            />
            <div className="mt-6 space-y-4">
              {/* Insurance type */}
              <SummaryCard title="Typ pojištění" icon={Shield}>
                <SummaryRow label="Typ" value={formData.insurance_type ? insuranceTypeLabel(formData.insurance_type as InsuranceType) : '—'} />
              </SummaryCard>

              {/* Insurance company */}
              <SummaryCard title="Pojišťovna" icon={Building2}>
                <SummaryRow
                  label="Pojišťovna"
                  value={selectedCompany?.name || formData.custom_company_name || '—'}
                />
              </SummaryCard>

              {/* Event details */}
              <SummaryCard title="Detail události" icon={ClipboardList}>
                <SummaryRow label="Datum" value={formatDate(formData.event_date)} />
                {formData.event_location && (
                  <SummaryRow label="Místo" value={formData.event_location} />
                )}
                <div className="flex gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-gray-500 dark:text-gray-400 text-sm min-w-[120px] flex-shrink-0">Popis</span>
                  <span className="text-gray-900 dark:text-white text-sm leading-relaxed">{formData.event_description}</span>
                </div>
                {formData.estimated_damage && (
                  <SummaryRow label="Odhad škody" value={formatCurrency(formData.estimated_damage)} />
                )}
              </SummaryCard>

              {/* Documents */}
              {files.length > 0 && (
                <SummaryCard title="Dokumenty" icon={FileText}>
                  <div className="space-y-1.5">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                        <span className="text-gray-400 text-xs flex-shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                    ))}
                  </div>
                </SummaryCard>
              )}

              {/* Contact */}
              <SummaryCard title="Kontaktní údaje" icon={User}>
                <SummaryRow label="Jméno" value={formData.contact_name} />
                <SummaryRow label="Email" value={formData.contact_email} />
                <SummaryRow label="Telefon" value={formData.contact_phone} />
              </SummaryCard>
            </div>
          </div>
        )}
      </div>

      {/* ============ Error ============ */}
      {error && (
        <div className="mt-4 flex items-start gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ============ Navigation ============ */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zpět
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Krok {step} z {STEPS.length}
          </span>
          {step < STEPS.length ? (
            step === 4 ? (
              <div className="flex gap-2">
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  Přeskočit
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Další
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Další
                <ArrowRight className="h-4 w-4" />
              </button>
            )
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Odesílání...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Odeslat hlášení
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// --------------- Sub-components ---------------

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, idx) => {
        const stepNum = idx + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep

        return (
          <div key={stepNum} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                  ${isCompleted
                    ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20'
                    : isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold">{stepNum}</span>
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium whitespace-nowrap hidden sm:block ${
                  isCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 sm:mt-[-18px] mt-0 transition-colors duration-300 ${
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

function StepHeader({ icon: Icon, title, subtitle }: { icon: typeof Shield; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">{subtitle}</p>
    </div>
  )
}

function SummaryCard({ title, icon: Icon, children }: { title: string; icon: typeof Shield; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-gray-500 dark:text-gray-400 text-sm min-w-[120px] flex-shrink-0">{label}</span>
      <span className="text-gray-900 dark:text-white text-sm font-medium">{value}</span>
    </div>
  )
}
