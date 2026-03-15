// Types and calculation functions for DPP/DPC agreements module

// ============================================
// ENUMS & TYPES
// ============================================

export type DohodaType = 'dpp' | 'dpc'
export type DohodaStatus = 'draft' | 'active' | 'terminated' | 'expired'
export type VykazStatus = 'draft' | 'confirmed' | 'locked'
export type PaymentStatus = 'unpaid' | 'paid' | 'partial'
export type PaymentMethod = 'bank' | 'cash' | 'other'
export type TaxType = 'srazkova' | 'zalohova'
export type DohodaDocType = 'dohoda' | 'prohlaseni' | 'potvrzeni_prijmu' | 'vykaz_prace'

export type Dohoda = {
  id: string
  company_id: string
  employee_id: string
  typ: DohodaType
  popis_prace: string
  misto_vykonu: string
  sazba: number
  max_hodin_rok: number
  platnost_od: string
  platnost_do: string | null
  prohlaseni_podepsano: boolean
  prohlaseni_datum: string | null
  podpis_zamestnavatel: boolean
  podpis_zamestnanec: boolean
  podpis_datum: string | null
  status: DohodaStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional)
  employee?: {
    first_name: string
    last_name: string
    birth_date: string
    personal_id?: string
    email?: string
    phone?: string
    address?: string
    health_insurance?: string
    bank_account?: string
  }
}

export type DohodaMesic = {
  id: string
  dohoda_id: string
  company_id: string
  period: string // 'YYYY-MM'
  hodiny: number
  hruba_mzda: number
  socialni_zamestnanec: number
  socialni_zamestnavatel: number
  zdravotni_zamestnanec: number
  zdravotni_zamestnavatel: number
  typ_dane: TaxType
  dan: number
  sleva_poplatnik: number
  cista_mzda: number
  naklady_zamestnavatel: number
  payment_status: PaymentStatus
  payment_date: string | null
  payment_method: PaymentMethod
  vykaz_status: VykazStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  dohoda?: Dohoda
}

export type DohodaDocument = {
  id: string
  dohoda_id: string
  company_id: string
  doc_type: DohodaDocType
  generated_url: string | null
  signed_url: string | null
  period: string | null
  status: 'generated' | 'sent' | 'signed' | 'archived'
  created_at: string
  updated_at: string
}

// ============================================
// CONSTANTS
// ============================================

export const DOHODA_TYPE_LABELS: Record<DohodaType, string> = {
  dpp: 'Dohoda o provedení práce',
  dpc: 'Dohoda o pracovní činnosti',
}

export const DOHODA_STATUS_LABELS: Record<DohodaStatus, string> = {
  draft: 'Koncept',
  active: 'Aktivní',
  terminated: 'Ukončená',
  expired: 'Vypršelá',
}

export const VYKAZ_STATUS_LABELS: Record<VykazStatus, string> = {
  draft: 'Rozpracovaný',
  confirmed: 'Potvrzený',
  locked: 'Uzamčený',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Nezaplaceno',
  paid: 'Zaplaceno',
  partial: 'Částečně',
}

// Insurance thresholds (2025/2026)
export const INSURANCE_THRESHOLD: Record<DohodaType, number> = {
  dpp: 10_000, // CZK/month — above this, full insurance applies
  dpc: 4_000,  // CZK/month — above this, full insurance applies
}

// Max hours
export const MAX_HOURS: Record<DohodaType, { value: number; unit: string; label: string }> = {
  dpp: { value: 300, unit: 'rok', label: '300 hodin/rok u jednoho zaměstnavatele' },
  dpc: { value: 20, unit: 'týden', label: '20 hodin/týden (průměr)' },
}

// Insurance & tax rates (2025/2026)
export const RATES = {
  // Employee rates
  social_employee: 0.071,   // 7.1% (was 6.5% until 2024, now includes nemocenské)
  health_employee: 0.045,   // 4.5%

  // Employer rates
  social_employer: 0.248,   // 24.8%
  health_employer: 0.09,    // 9%

  // Tax
  tax_rate: 0.15,           // 15% income tax
  tax_rate_high: 0.23,      // 23% for income > 48x avg wage (~1,935,552 CZK/year)

  // Tax credits (monthly, 2025)
  tax_credit_basic: 2_570,  // basic taxpayer credit
  tax_credit_student: 335,  // student credit
  tax_credit_disability_1: 210,
  tax_credit_disability_2: 420,
  tax_credit_disability_3: 1_345,
  tax_bonus_child_1: 1_267, // 1st child
  tax_bonus_child_2: 1_860, // 2nd child
  tax_bonus_child_3: 2_320, // 3rd+ child
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

export type CalculationParams = {
  typ: DohodaType
  hodiny: number
  sazba: number
  prohlaseni: boolean
  student?: boolean
  disability_level?: 0 | 1 | 2 | 3
  children_count?: number
}

export type CalculationResult = {
  gross: number
  social_employee: number
  social_employer: number
  health_employee: number
  health_employer: number
  tax_type: TaxType
  tax_amount: number
  tax_credit: number
  net: number
  total_employer_cost: number
  above_threshold: boolean
}

export function isAboveThreshold(typ: DohodaType, grossMonthly: number): boolean {
  return grossMonthly > INSURANCE_THRESHOLD[typ]
}

export function calculateDohodaMesic(params: CalculationParams): CalculationResult {
  const { typ, hodiny, sazba, prohlaseni, student = false, disability_level = 0, children_count = 0 } = params

  const gross = Math.round(hodiny * sazba)
  const aboveThreshold = isAboveThreshold(typ, gross)

  let social_employee = 0
  let social_employer = 0
  let health_employee = 0
  let health_employer = 0

  if (aboveThreshold) {
    social_employee = Math.round(gross * RATES.social_employee)
    social_employer = Math.round(gross * RATES.social_employer)
    health_employee = Math.round(gross * RATES.health_employee)
    health_employer = Math.round(gross * RATES.health_employer)
  }

  // Tax calculation
  let tax_type: TaxType
  let tax_amount: number
  let tax_credit = 0

  if (!prohlaseni && !aboveThreshold) {
    // Withholding tax: 15% flat, no credits
    tax_type = 'srazkova'
    tax_amount = Math.round(gross * RATES.tax_rate)
  } else {
    // Advance tax: with credits
    tax_type = 'zalohova'
    const taxBase = gross - social_employee - health_employee
    const rawTax = Math.round(taxBase * RATES.tax_rate)

    // Calculate credits
    tax_credit = RATES.tax_credit_basic

    if (student) {
      tax_credit += RATES.tax_credit_student
    }

    if (disability_level === 1) tax_credit += RATES.tax_credit_disability_1
    if (disability_level === 2) tax_credit += RATES.tax_credit_disability_2
    if (disability_level === 3) tax_credit += RATES.tax_credit_disability_3

    // Child bonus
    if (children_count >= 1) tax_credit += RATES.tax_bonus_child_1
    if (children_count >= 2) tax_credit += RATES.tax_bonus_child_2
    if (children_count >= 3) {
      tax_credit += RATES.tax_bonus_child_3 * (children_count - 2)
    }

    // Tax can be negative (tax bonus for children)
    tax_amount = rawTax - tax_credit
    if (tax_amount < 0) {
      // Negative = tax bonus (daňový bonus)
      // Keep as negative — caller can show as bonus
    }
  }

  const net = gross - social_employee - health_employee - Math.max(0, tax_amount)
  const total_employer_cost = gross + social_employer + health_employer

  return {
    gross,
    social_employee,
    social_employer,
    health_employee,
    health_employer,
    tax_type,
    tax_amount,
    tax_credit,
    net,
    total_employer_cost,
    above_threshold: aboveThreshold,
  }
}

// ============================================
// TAX IMPACT COMPARISON: DPP/DPC vs HPP
// ============================================

export type TaxImpactComparison = {
  gross: number
  // HPP scenario
  hpp_employer_cost: number
  hpp_employee_net: number
  hpp_social_employer: number
  hpp_health_employer: number
  hpp_social_employee: number
  hpp_health_employee: number
  hpp_tax: number
  // DPP/DPC scenario
  dohoda_employer_cost: number
  dohoda_employee_net: number
  dohoda_social_employer: number
  dohoda_health_employer: number
  dohoda_social_employee: number
  dohoda_health_employee: number
  dohoda_tax: number
  dohoda_tax_type: TaxType
  // Comparison
  employer_saving: number
  employer_saving_percent: number
  employee_net_diff: number
}

export function calculateTaxImpact(params: {
  typ: DohodaType
  gross: number
  prohlaseni: boolean
  student?: boolean
  children_count?: number
}): TaxImpactComparison {
  const { typ, gross, prohlaseni, student = false, children_count = 0 } = params
  const aboveThreshold = isAboveThreshold(typ, gross)

  // --- HPP calculation (always full insurance) ---
  const hpp_social_employer = Math.round(gross * RATES.social_employer)
  const hpp_health_employer = Math.round(gross * RATES.health_employer)
  const hpp_employer_cost = gross + hpp_social_employer + hpp_health_employer

  const hpp_social_employee = Math.round(gross * RATES.social_employee)
  const hpp_health_employee = Math.round(gross * RATES.health_employee)
  const hpp_taxBase = gross - hpp_social_employee - hpp_health_employee
  let hpp_credit = RATES.tax_credit_basic
  if (student) hpp_credit += RATES.tax_credit_student
  if (children_count >= 1) hpp_credit += RATES.tax_bonus_child_1
  if (children_count >= 2) hpp_credit += RATES.tax_bonus_child_2
  if (children_count >= 3) hpp_credit += RATES.tax_bonus_child_3 * (children_count - 2)

  const hpp_tax = Math.max(0, Math.round(hpp_taxBase * RATES.tax_rate) - (prohlaseni ? hpp_credit : 0))
  const hpp_employee_net = gross - hpp_social_employee - hpp_health_employee - hpp_tax

  // --- DPP/DPC calculation ---
  let dohoda_social_employer = 0, dohoda_health_employer = 0
  let dohoda_social_employee = 0, dohoda_health_employee = 0

  if (aboveThreshold) {
    dohoda_social_employer = Math.round(gross * RATES.social_employer)
    dohoda_health_employer = Math.round(gross * RATES.health_employer)
    dohoda_social_employee = Math.round(gross * RATES.social_employee)
    dohoda_health_employee = Math.round(gross * RATES.health_employee)
  }

  const dohoda_employer_cost = gross + dohoda_social_employer + dohoda_health_employer

  let dohoda_tax: number
  let dohoda_tax_type: TaxType

  if (!prohlaseni && !aboveThreshold) {
    dohoda_tax_type = 'srazkova'
    dohoda_tax = Math.round(gross * RATES.tax_rate)
  } else {
    dohoda_tax_type = 'zalohova'
    const taxBase = gross - dohoda_social_employee - dohoda_health_employee
    dohoda_tax = Math.max(0, Math.round(taxBase * RATES.tax_rate) - (prohlaseni ? hpp_credit : 0))
  }

  const dohoda_employee_net = gross - dohoda_social_employee - dohoda_health_employee - dohoda_tax

  const employer_saving = hpp_employer_cost - dohoda_employer_cost

  return {
    gross,
    hpp_employer_cost,
    hpp_employee_net,
    hpp_social_employer,
    hpp_health_employer,
    hpp_social_employee,
    hpp_health_employee,
    hpp_tax,
    dohoda_employer_cost,
    dohoda_employee_net,
    dohoda_social_employer,
    dohoda_health_employer,
    dohoda_social_employee,
    dohoda_health_employee,
    dohoda_tax,
    dohoda_tax_type,
    employer_saving,
    employer_saving_percent: hpp_employer_cost > 0 ? Math.round((employer_saving / hpp_employer_cost) * 100) : 0,
    employee_net_diff: dohoda_employee_net - hpp_employee_net,
  }
}
