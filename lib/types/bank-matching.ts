// ============================================
// BANK MATCHING - TypeScript Types
// ============================================
// MC Phase 1: Extended types for bank transaction matching,
// periodic patterns, match groups, and cash management
// ============================================

// ============================================
// TRANSACTION CATEGORIES (27 values)
// ============================================

export type TransactionCategory =
  // Original
  | 'uncategorized'
  | 'invoice_income'
  | 'other_taxable'
  | 'private_transfer'
  | 'owner_deposit'
  // Expense categories
  | 'expense_material'
  | 'expense_services'
  | 'expense_rent'
  | 'expense_energy'
  | 'expense_transport'
  | 'expense_phone_internet'
  | 'expense_insurance'
  | 'expense_salary'
  | 'expense_tax_fee'
  | 'expense_other'
  // Income categories
  | 'income_services'
  | 'income_goods'
  | 'income_rent'
  | 'income_interest'
  | 'income_other'
  // Special / non-taxable
  | 'loan_repayment'
  | 'loan_received'
  | 'internal_transfer'
  | 'vat_payment'
  | 'tax_payment'
  | 'social_insurance_payment'
  | 'health_insurance_payment'

// ============================================
// MATCH METHODS (13 values)
// ============================================

export type MatchMethod =
  | 'variable_symbol'
  | 'amount_date'
  | 'fuzzy'
  | 'manual'
  | 'dohoda_amount_name'
  | 'dohoda_amount'
  | 'partial_payment'
  | 'split_payment'
  | 'periodic_pattern'
  | 'ai_suggestion'
  | 'iban_match'
  | 'ico_match'
  | 'qr_code'

// ============================================
// BANK TRANSACTION (extended)
// ============================================

export interface BankTransaction {
  id: string
  company_id: string
  bank_statement_document_id?: string | null
  transaction_date: string
  amount: number
  currency: string
  variable_symbol?: string | null
  constant_symbol?: string | null
  specific_symbol?: string | null
  counterparty_account?: string | null
  counterparty_name?: string | null
  counterparty_bank_code?: string | null
  description?: string | null
  user_note?: string | null
  category: TransactionCategory
  matched_document_id?: string | null
  matched_invoice_id?: string | null
  matched_dohoda_mesic_id?: string | null
  match_confidence?: number | null
  match_method?: MatchMethod | null
  match_group_id?: string | null
  is_recurring: boolean
  periodic_pattern_id?: string | null
  tax_impact: number
  vat_impact: number
  social_impact: number
  health_impact: number
  total_impact: number
  period?: string | null
  created_at: string
  updated_at: string
}

// ============================================
// MATCH RESULT (extended)
// ============================================

export interface MatchResultV2 {
  document_id?: string
  invoice_id?: string
  dohoda_mesic_id?: string
  confidence: number
  method: MatchMethod
  match_group_id?: string
  partial_amount?: number
  suggested_category?: TransactionCategory
}

// ============================================
// PERIODIC PATTERN
// ============================================

export type PatternFrequency = 'monthly' | 'quarterly' | 'yearly' | 'irregular'

export interface PeriodicPattern {
  id: string
  company_id: string
  pattern_name: string
  counterparty_name?: string | null
  counterparty_account?: string | null
  variable_symbol?: string | null
  amount_avg?: number | null
  amount_min?: number | null
  amount_max?: number | null
  frequency: PatternFrequency
  category?: TransactionCategory | null
  next_expected_date?: string | null
  tolerance_days: number
  occurrence_count: number
  last_occurrence_date?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// TRANSACTION MATCH GROUP (1:N partial matching)
// ============================================

export type MatchGroupTargetType = 'document' | 'invoice'

export interface TransactionMatchGroup {
  id: string
  company_id: string
  target_type: MatchGroupTargetType
  target_id: string
  target_amount: number
  matched_amount: number
  is_fully_matched: boolean
  match_count: number
  created_at: string
  updated_at: string
}

// ============================================
// CASH REGISTER & TRANSACTIONS
// ============================================

export type CashDocType = 'PPD' | 'VPD'

export interface CashRegister {
  id: string
  company_id: string
  name: string
  currency: string
  initial_balance: number
  current_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CashTransaction {
  id: string
  company_id: string
  cash_register_id: string
  doc_type: CashDocType
  doc_number: string
  transaction_date: string
  amount: number
  currency: string
  description?: string | null
  counterparty_name?: string | null
  category?: TransactionCategory | null
  matched_document_id?: string | null
  period?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

// ============================================
// CATEGORY LABELS (for UI display)
// ============================================

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  uncategorized: 'Nezařazeno',
  invoice_income: 'Příjem z faktury',
  other_taxable: 'Ostatní zdanitelný příjem',
  private_transfer: 'Osobní převod',
  owner_deposit: 'Vklad majitele',
  expense_material: 'Materiál',
  expense_services: 'Služby',
  expense_rent: 'Nájem',
  expense_energy: 'Energie',
  expense_transport: 'Doprava',
  expense_phone_internet: 'Telefon / internet',
  expense_insurance: 'Pojištění',
  expense_salary: 'Mzdy',
  expense_tax_fee: 'Daně a poplatky',
  expense_other: 'Ostatní výdaje',
  income_services: 'Příjem za služby',
  income_goods: 'Příjem za zboží',
  income_rent: 'Příjem z nájmu',
  income_interest: 'Úroky',
  income_other: 'Ostatní příjmy',
  loan_repayment: 'Splátka úvěru',
  loan_received: 'Přijatý úvěr',
  internal_transfer: 'Interní převod',
  vat_payment: 'Platba DPH',
  tax_payment: 'Platba daně z příjmu',
  social_insurance_payment: 'Platba sociálního pojištění',
  health_insurance_payment: 'Platba zdravotního pojištění',
}

// Non-taxable categories — excluded from tax impact calculations
export const NON_TAXABLE_CATEGORIES: TransactionCategory[] = [
  'private_transfer',
  'owner_deposit',
  'loan_repayment',
  'loan_received',
  'internal_transfer',
  'vat_payment',
  'tax_payment',
  'social_insurance_payment',
  'health_insurance_payment',
]

// Categories that are expenses (for matching with documents)
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'expense_material',
  'expense_services',
  'expense_rent',
  'expense_energy',
  'expense_transport',
  'expense_phone_internet',
  'expense_insurance',
  'expense_salary',
  'expense_tax_fee',
  'expense_other',
]

// Categories that are income (for matching with invoices)
export const INCOME_CATEGORIES: TransactionCategory[] = [
  'invoice_income',
  'other_taxable',
  'income_services',
  'income_goods',
  'income_rent',
  'income_interest',
  'income_other',
]
