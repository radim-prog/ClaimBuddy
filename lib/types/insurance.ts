// Typy pro pojištění a smlouvy

// Kategorie pojištění
export type InsuranceCategory =
  | 'life_insurance'           // Životní pojištění
  | 'pension_savings'          // Penzijní spoření
  | 'long_term_care'           // Pojištění dlouhodobé péče
  | 'dip'                      // Dlouhodobý investiční produkt
  | 'liability_business'       // Pojištění odpovědnosti - podnikatelské
  | 'liability_professional'   // Pojištění odpovědnosti - profesní
  | 'property_business'        // Pojištění majetku firmy
  | 'vehicle'                  // Pojištění vozidel
  | 'employee_statutory'       // Zákonné pojištění zaměstnanců
  | 'employee_supplementary'   // Nadstandardní pojištění zaměstnanců
  | 'business_interruption'    // Pojištění přerušení provozu
  | 'cyber'                    // Kybernetické pojištění
  | 'receivables'              // Pojištění pohledávek
  | 'property_personal'        // Pojištění nemovitosti (osobní)
  | 'household'                // Pojištění domácnosti
  | 'accident'                 // Úrazové pojištění
  | 'travel'                   // Cestovní pojištění
  | 'other'                    // Ostatní

export const INSURANCE_CATEGORY_LABELS: Record<InsuranceCategory, string> = {
  life_insurance: 'Životní pojištění',
  pension_savings: 'Penzijní spoření',
  long_term_care: 'Pojištění dlouhodobé péče',
  dip: 'Dlouhodobý investiční produkt (DIP)',
  liability_business: 'Pojištění odpovědnosti - podnikatelské',
  liability_professional: 'Pojištění odpovědnosti - profesní',
  property_business: 'Pojištění majetku firmy',
  vehicle: 'Pojištění vozidel',
  employee_statutory: 'Zákonné pojištění zaměstnanců',
  employee_supplementary: 'Pojištění zaměstnanců - nadstandardní',
  business_interruption: 'Pojištění přerušení provozu',
  cyber: 'Kybernetické pojištění',
  receivables: 'Pojištění pohledávek',
  property_personal: 'Pojištění nemovitosti',
  household: 'Pojištění domácnosti',
  accident: 'Úrazové pojištění',
  travel: 'Cestovní pojištění',
  other: 'Ostatní pojištění',
}

// Skupiny kategorií pro zobrazení
export const INSURANCE_CATEGORY_GROUPS = {
  tax_deductible: {
    label: 'Daňově odečitatelné',
    description: 'Max. odpočet 48 000 Kč/rok od základu daně',
    categories: ['life_insurance', 'pension_savings', 'long_term_care', 'dip'] as InsuranceCategory[],
  },
  business: {
    label: 'Podnikatelská pojištění',
    description: 'Pojištění související s podnikáním',
    categories: ['liability_business', 'liability_professional', 'property_business', 'vehicle', 'employee_statutory', 'employee_supplementary', 'business_interruption', 'cyber', 'receivables'] as InsuranceCategory[],
  },
  personal: {
    label: 'Osobní pojištění',
    description: 'Pojištění pro soukromé účely',
    categories: ['property_personal', 'household', 'accident', 'travel', 'other'] as InsuranceCategory[],
  },
}

// Frekvence platby
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'one_time'

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  monthly: 'Měsíčně',
  quarterly: 'Čtvrtletně',
  semi_annual: 'Pololetně',
  annual: 'Ročně',
  one_time: 'Jednorázově',
}

// Stav pojistky
export type InsuranceStatus = 'active' | 'pending' | 'expired' | 'cancelled'

export const INSURANCE_STATUS_LABELS: Record<InsuranceStatus, string> = {
  active: 'Aktivní',
  pending: 'Čeká na aktivaci',
  expired: 'Vypršela',
  cancelled: 'Zrušena',
}

// Pojišťovny
export const INSURANCE_PROVIDERS = [
  'Allianz',
  'AXA',
  'Česká podnikatelská pojišťovna',
  'Česká pojišťovna',
  'ČSOB Pojišťovna',
  'Direct pojišťovna',
  'Generali',
  'Kooperativa',
  'Komerční pojišťovna',
  'MetLife',
  'NN pojišťovna',
  'UNIQA',
  'Pillow',
  'Slavia pojišťovna',
  'Jiná',
]

// Penzijní společnosti
export const PENSION_PROVIDERS = [
  'Allianz penzijní společnost',
  'Conseq penzijní společnost',
  'Česká spořitelna - penzijní společnost',
  'ČSOB Penzijní společnost',
  'Generali penzijní společnost',
  'KB Penzijní společnost',
  'NN Penzijní společnost',
  'Jiná',
]

// Hlavní typ pojištění/smlouvy
export type Insurance = {
  id: string
  company_id: string

  // Základní údaje
  category: InsuranceCategory
  provider: string               // Pojišťovna / Poskytovatel
  contract_number: string        // Číslo smlouvy
  name: string                   // Vlastní název/popis

  // Předmět pojištění
  insured_subject: string        // Co/koho pojištění kryje
  insured_person?: string        // Pojištěná osoba (u životního atd.)

  // Finanční údaje
  premium_amount: number         // Pojistné / Příspěvek
  payment_frequency: PaymentFrequency
  annual_premium: number         // Roční pojistné (vypočtené)
  coverage_limit?: number        // Limit plnění
  deductible?: number            // Spoluúčast

  // Daňové
  is_tax_deductible: boolean     // Daňově odečitatelné
  tax_deductible_amount?: number // Částka k odpočtu (může se lišit od pojistného)

  // Termíny
  contract_date: string          // Datum uzavření smlouvy
  effective_date: string         // Datum účinnosti
  anniversary_date: string       // Výroční datum (kdy se obnovuje/platí)
  expiry_date?: string           // Datum ukončení (pokud je omezená)
  next_payment_date?: string     // Datum další platby

  // Stav
  status: InsuranceStatus

  // Vazby
  linked_asset_id?: string       // Propojení s majetkem (auto, nemovitost)
  linked_employee_id?: string    // Propojení se zaměstnancem

  // Dokumenty a poznámky
  notes?: string

  // Metadata
  created_at: string
  updated_at: string
}

// Typ výročí/termínu pro kalendář
export type AnniversaryType =
  | 'insurance_renewal'    // Výročí pojistky
  | 'insurance_payment'    // Platba pojistky
  | 'vehicle_stk'          // STK vozidla
  | 'vehicle_insurance'    // Pojištění vozidla (z majetku)
  | 'employee_contract'    // Výročí pracovní smlouvy
  | 'employee_medical'     // Lékařská prohlídka zaměstnance
  | 'tax_deadline'         // Daňový termín
  | 'other'                // Ostatní

export const ANNIVERSARY_TYPE_LABELS: Record<AnniversaryType, string> = {
  insurance_renewal: 'Výročí pojistky',
  insurance_payment: 'Platba pojistky',
  vehicle_stk: 'STK vozidla',
  vehicle_insurance: 'Pojištění vozidla',
  employee_contract: 'Výročí smlouvy',
  employee_medical: 'Lékařská prohlídka',
  tax_deadline: 'Daňový termín',
  other: 'Jiný termín',
}

// Položka v kalendáři výročí
export type AnniversaryItem = {
  id: string
  company_id: string
  type: AnniversaryType
  title: string
  description?: string
  date: string
  source_type: 'insurance' | 'asset' | 'employee' | 'manual'
  source_id?: string          // ID zdrojového záznamu
  is_recurring: boolean       // Opakuje se každý rok
  reminder_days?: number      // Upozornit X dní předem
  status: 'upcoming' | 'due' | 'overdue' | 'completed'
}

// Helper pro výpočet ročního pojistného
export function calculateAnnualPremium(amount: number, frequency: PaymentFrequency): number {
  switch (frequency) {
    case 'monthly': return amount * 12
    case 'quarterly': return amount * 4
    case 'semi_annual': return amount * 2
    case 'annual': return amount
    case 'one_time': return amount
    default: return amount
  }
}

// Helper pro zjištění zda je kategorie daňově odečitatelná
export function isTaxDeductibleCategory(category: InsuranceCategory): boolean {
  return INSURANCE_CATEGORY_GROUPS.tax_deductible.categories.includes(category)
}

// Helper pro získání skupiny kategorie
export function getCategoryGroup(category: InsuranceCategory): string | null {
  for (const [groupKey, group] of Object.entries(INSURANCE_CATEGORY_GROUPS)) {
    if (group.categories.includes(category)) {
      return groupKey
    }
  }
  return null
}

// =============================================================================
// POJISTNÉ UDÁLOSTI (Insurance Claims / Cases)
// =============================================================================

// --- Enums as union types ---

export type InsuranceType = 'auto' | 'property' | 'life' | 'liability' | 'travel' | 'industrial' | 'other'

export type InsuranceCaseStatus = 'new' | 'gathering_docs' | 'submitted' | 'under_review' | 'additional_info' | 'partially_approved' | 'approved' | 'rejected' | 'appealed' | 'closed' | 'cancelled'

export type CasePriority = 'low' | 'normal' | 'high' | 'urgent'

export type DocumentType = 'claim_report' | 'photo' | 'expert_report' | 'correspondence' | 'decision' | 'invoice' | 'power_of_attorney' | 'police_report' | 'medical_report' | 'other'

export type PaymentType = 'partial' | 'full' | 'advance' | 'refund'

// --- Service modes ---
export type ServiceMode = 'self_service' | 'consultation' | 'full_representation' | 'ai_processing'

export type PowerOfAttorneyStatus = 'not_required' | 'pending' | 'signed' | 'revoked'

export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'refunded'

export const SERVICE_MODE_LABELS: Record<ServiceMode, string> = {
  self_service: 'Samoobsluha',
  consultation: 'Konzultace',
  full_representation: 'Plné zastoupení',
  ai_processing: 'AI zpracování',
}

export const POWER_OF_ATTORNEY_STATUS_LABELS: Record<PowerOfAttorneyStatus, string> = {
  not_required: 'Není třeba',
  pending: 'Čeká na podpis',
  signed: 'Podepsána',
  revoked: 'Zrušena',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  not_required: 'Není třeba',
  pending: 'Čeká na platbu',
  paid: 'Zaplaceno',
  refunded: 'Vráceno',
}

// --- DB row types ---

export interface InsuranceCompany {
  id: string
  name: string
  code: string | null
  ico: string | null
  address: string | null
  phone: string | null
  email: string | null
  claims_email: string | null
  claims_phone: string | null
  web_url: string | null
  logo_path: string | null
  active: boolean
  created_at: string
}

export interface InsuranceCase {
  id: string
  company_id: string | null
  assigned_to: string | null
  case_number: string
  policy_number: string | null
  claim_number: string | null
  insurance_company_id: string | null
  insurance_type: InsuranceType
  event_date: string | null
  event_description: string | null
  event_location: string | null
  claimed_amount: number | null
  approved_amount: number | null
  paid_amount: number
  status: InsuranceCaseStatus
  priority: CasePriority
  deadline: string | null
  note: string | null
  tags: string[]
  project_id: string | null
  // Service mode fields
  service_mode: ServiceMode
  payment_status: PaymentStatus
  payment_id: string | null
  power_of_attorney_status: PowerOfAttorneyStatus
  success_fee_percent: number | null
  ai_report: string | null
  ai_processed_at: string | null
  // Structured contact info (from intake form)
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_user_id: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  insurance_company?: InsuranceCompany
  company?: { id: string; name: string; ico: string | null }
  assigned_user?: { id: string; name: string }
  documents_count?: number
}

export interface InsuranceCaseDocument {
  id: string
  case_id: string
  name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  document_type: DocumentType
  uploaded_by: string | null
  note: string | null
  created_at: string
}

export type EventVisibility = 'internal' | 'client' | 'all'

export interface InsuranceCaseEvent {
  id: string
  case_id: string
  event_type: string
  actor: string
  description: string
  metadata: Record<string, unknown> | null
  visibility: EventVisibility
  attachment_url: string | null
  created_at: string
}

export interface InsurancePayment {
  id: string
  case_id: string
  amount: number
  payment_type: PaymentType
  payment_date: string
  reference: string | null
  note: string | null
  created_by: string | null
  created_at: string
}

// --- Input types for creating/updating ---

export interface CreateCaseInput {
  company_id?: string
  assigned_to?: string
  policy_number?: string
  claim_number?: string
  insurance_company_id?: string
  insurance_type: InsuranceType
  event_date?: string
  event_description?: string
  event_location?: string
  claimed_amount?: number
  priority?: CasePriority
  deadline?: string
  note?: string
  tags?: string[]
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  contact_user_id?: string
}

export interface UpdateCaseInput {
  assigned_to?: string | null
  policy_number?: string | null
  claim_number?: string | null
  insurance_company_id?: string | null
  insurance_type?: InsuranceType
  event_date?: string | null
  event_description?: string | null
  event_location?: string | null
  claimed_amount?: number | null
  approved_amount?: number | null
  status?: InsuranceCaseStatus
  priority?: CasePriority
  deadline?: string | null
  note?: string | null
  tags?: string[]
}

// --- Helper functions ---

export function insuranceTypeLabel(type: InsuranceType): string {
  const labels: Record<InsuranceType, string> = {
    auto: 'Autopojištění',
    property: 'Pojištění majetku',
    life: 'Životní pojištění',
    liability: 'Pojištění odpovědnosti',
    travel: 'Cestovní pojištění',
    industrial: 'Průmyslové pojištění',
    other: 'Jiné',
  }
  return labels[type] || type
}

export function insuranceStatusLabel(status: InsuranceCaseStatus): string {
  const labels: Record<InsuranceCaseStatus, string> = {
    new: 'Nový',
    gathering_docs: 'Shromažďování dokumentů',
    submitted: 'Podáno',
    under_review: 'V posouzení',
    additional_info: 'Doplnění informací',
    partially_approved: 'Částečně schváleno',
    approved: 'Schváleno',
    rejected: 'Zamítnuto',
    appealed: 'Odvolání',
    closed: 'Uzavřeno',
    cancelled: 'Zrušeno',
  }
  return labels[status] || status
}

export function insuranceStatusColor(status: InsuranceCaseStatus): string {
  const colors: Record<InsuranceCaseStatus, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    gathering_docs: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    submitted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    under_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    additional_info: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    partially_approved: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    appealed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function priorityLabel(priority: CasePriority): string {
  const labels: Record<CasePriority, string> = {
    low: 'Nízká',
    normal: 'Normální',
    high: 'Vysoká',
    urgent: 'Urgentní',
  }
  return labels[priority] || priority
}

export function priorityColor(priority: CasePriority): string {
  const colors: Record<CasePriority, string> = {
    low: 'text-gray-500',
    normal: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  }
  return colors[priority] || 'text-gray-500'
}

export function documentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    claim_report: 'Hlášení škody',
    photo: 'Fotodokumentace',
    expert_report: 'Znalecký posudek',
    correspondence: 'Korespondence',
    decision: 'Rozhodnutí pojišťovny',
    invoice: 'Faktura',
    power_of_attorney: 'Plná moc',
    police_report: 'Policejní protokol',
    medical_report: 'Lékařská zpráva',
    other: 'Jiné',
  }
  return labels[type] || type
}

export function paymentTypeLabel(type: PaymentType): string {
  const labels: Record<PaymentType, string> = {
    partial: 'Částečné plnění',
    full: 'Plné plnění',
    advance: 'Záloha',
    refund: 'Vrácení',
  }
  return labels[type] || type
}

// Case number generator: PU-YYYY-NNN
export function generateCaseNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear()
  const padded = String(sequenceNumber).padStart(3, '0')
  return `PU-${year}-${padded}`
}
