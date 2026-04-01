export const SECTION_TYPES = ['§7', '§9', '§10'] as const
export type SectionType = (typeof SECTION_TYPES)[number]

export const SECTION_DEFAULTS: Record<SectionType, { label: string; defaultFlatRate: number }> = {
  '§7': { label: 'Podnikání', defaultFlatRate: 60 },
  '§9': { label: 'Pronájem', defaultFlatRate: 30 },
  '§10': { label: 'Ostatní příjmy', defaultFlatRate: 40 },
}

export type IncomeSection = {
  type: SectionType
  label: string
  revenue: number
  expenses: number
  flat_rate?: number | null  // e.g. 60 for §7, 30 for §9 — null = actual expenses
}

export type SectionResult = {
  type: '§7' | '§9' | '§10'
  label: string
  revenue: number
  expenses: number
  flatRateUsed: number | null
  dzd: number  // dílčí základ daně
}

export type TaxPeriodData = {
  id: string
  company_id: string
  period: string
  revenue: number
  expenses: number
  vat_output: number
  vat_input: number
  vat_result: number | null
  tax_base_override: number | null
  notes: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type TaxCompany = {
  id: string
  name: string
  group_name: string | null
  vat_payer: boolean
  vat_period: 'monthly' | 'quarterly' | null
  legal_form: string
  status: string
  monthly_reporting: boolean
  managing_director?: string | null
}

export type TaxAnnualConfigRow = {
  id?: string
  company_id: string
  year: number
  mortgage_interest: number
  dip_contributions: number
  savings_contributions: number
  other_deductions: number
  taxpayer_discount: boolean
  children_count: number
  children_details: Array<{ order: number; ztpp: boolean }>
  other_credits: number
  social_advances_paid: number
  health_advances_paid: number
  initial_tax_base: number | null
  is_flat_tax: boolean
  flat_tax_band: number | null
  is_secondary_activity: boolean
  months_active: number
  use_profile_data: boolean
  annual_revenue: number | null
  annual_expenses: number | null
  income_sections: IncomeSection[] | null
  notes: string | null
  updated_by: string | null
  created_at?: string
  updated_at?: string
}

export type EmployeeTaxReturnRow = {
  id?: string
  company_id: string
  employee_id: string
  year: number
  gross_income: number
  mortgage_interest: number
  dip_contributions: number
  savings_contributions: number
  life_insurance: number
  other_deductions: number
  taxpayer_discount: boolean
  children_count: number
  children_details: Array<{ order: number; ztpp: boolean }>
  disability_credit: number
  ztpp: boolean
  student: boolean
  other_credits: number
  tax_advances_paid: number
  status: 'not_started' | 'in_progress' | 'completed'
  notes: string | null
  completed_at: string | null
  updated_by: string | null
  created_at?: string
  updated_at?: string
}
