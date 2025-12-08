// Typy pro onboarding klientů

export type OnboardingStage =
  | 'new-lead'
  | 'qualification'
  | 'contracts'
  | 'data-collection'
  | 'system-setup'
  | 'onboarding-meeting'
  | 'active'

export type OnboardingPriority = 'high' | 'medium' | 'low'

export type OnboardingDocumentType =
  | 'contract'
  | 'power-of-attorney'
  | 'gdpr'
  | 'business-registry'
  | 'previous-closure'
  | 'other'

export interface OnboardingClient {
  id: string
  stage: OnboardingStage
  priority: OnboardingPriority

  // Základní údaje
  company_name: string
  ico?: string
  dic?: string
  legal_form?: string
  vat_payer?: boolean
  vat_registration_date?: string
  address?: string

  // Kontakty
  contact_person: string
  email: string
  phone: string
  secondary_contact?: string

  // Bankovní údaje
  bank_name?: string
  bank_account?: string
  bank_access_username?: string

  // Systémové přístupy
  data_box_id?: string
  tax_office_access?: string
  cssz_access?: string
  health_insurance_access?: string

  // Metadata
  assigned_to?: string // UUID účetního
  assigned_to_name?: string
  expected_start_date?: string
  service_scope?: string
  previous_accountant?: string
  estimated_documents_monthly?: number
  special_requirements?: string
  notes?: string

  // Progress tracking
  progress_percentage: number
  completed_steps: string[]

  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string

  // Relations
  converted_company_id?: string
}

export interface OnboardingDocument {
  id: string
  onboarding_client_id: string
  document_type: OnboardingDocumentType
  file_name: string
  file_url: string
  uploaded_at: string
  uploaded_by: string
}

export interface OnboardingTimelineEvent {
  id: string
  onboarding_client_id: string
  event_type: 'stage_change' | 'note_added' | 'document_uploaded' | 'data_updated' | 'assigned'
  event_data: any
  created_at: string
  created_by: string
  created_by_name?: string
}

export const STAGE_CONFIG: Record<
  OnboardingStage,
  {
    label: string
    color: string
    bgColor: string
    borderColor: string
    icon: string
    description: string
    requiredSteps: string[]
  }
> = {
  'new-lead': {
    label: 'Nový lead',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🎯',
    description: 'První kontakt s potenciálním klientem',
    requiredSteps: ['Úvodní telefonát', 'Email s představením', 'Zaslání ceníku'],
  },
  qualification: {
    label: 'Kvalifikace',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '📋',
    description: 'Ověření vhodnosti klienta',
    requiredSteps: ['První schůzka', 'Zjištění rozsahu služeb', 'Odhad náročnosti'],
  },
  contracts: {
    label: 'Smlouvy',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: '📄',
    description: 'Podpis smluv a plných mocí',
    requiredSteps: [
      'Smlouva o vedení účetnictví',
      'Plná moc pro úřady',
      'GDPR souhlas',
      'Zaslání podepsaných smluv',
    ],
  },
  'data-collection': {
    label: 'Sběr údajů',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '📊',
    description: 'Získání všech potřebných informací',
    requiredSteps: [
      'IČO/DIČ a základní údaje',
      'Bankovní spojení',
      'Přístupy do systémů (banka, ČSSZ, ZP, FÚ)',
      'Datová schránka',
    ],
  },
  'system-setup': {
    label: 'Nastavení systému',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    icon: '⚙️',
    description: 'Konfigurace v účetním systému',
    requiredSteps: [
      'Vytvoření v databázi',
      'Nastavení měsíčních uzávěrek',
      'Konfigurace exportů',
      'Test přístupu do systémů',
    ],
  },
  'onboarding-meeting': {
    label: 'Onboarding schůzka',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '🎓',
    description: 'Vysvětlení procesů klientovi',
    requiredSteps: [
      'Školení klienta',
      'Vysvětlení procesů',
      'První nahrání dokumentů',
      'Zodpovězení dotazů',
    ],
  },
  active: {
    label: 'Aktivní klient',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: '✅',
    description: 'Klient kompletně nastaven',
    requiredSteps: ['Převod do standardního CRM', 'První uzávěrka dokončena'],
  },
}

export const DOCUMENT_TYPE_LABELS: Record<OnboardingDocumentType, string> = {
  contract: 'Smlouva o vedení účetnictví',
  'power-of-attorney': 'Plná moc',
  gdpr: 'GDPR souhlas',
  'business-registry': 'Výpis z OR',
  'previous-closure': 'Předchozí uzávěrka',
  other: 'Ostatní',
}
