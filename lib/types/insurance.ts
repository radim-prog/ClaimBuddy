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
