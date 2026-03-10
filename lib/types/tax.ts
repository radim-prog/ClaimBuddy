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
}
