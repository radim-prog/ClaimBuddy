// Document Register (Kniha dokladů) types

// --- Document Types ---

export type DocumentType =
  | 'bank_statement'
  | 'expense_invoice'
  | 'income_invoice'
  | 'receipt'
  | 'advance_invoice'
  | 'credit_note'
  | 'proforma_invoice'
  | 'internal_document'
  | 'cash_receipt'
  | 'travel_order'
  | 'payroll'
  | 'tax_document'
  | 'contract'
  | 'power_of_attorney'
  | 'correspondence'
  | 'annual_report'
  | 'other'

export type DocumentStatus =
  | 'missing'
  | 'uploaded'
  | 'extracting'
  | 'extracted'
  | 'approved'
  | 'rejected'
  | 'booked'

export interface DocumentRegisterEntry {
  id: string
  company_id: string
  period: string // YYYY-MM
  type: DocumentType
  file_name: string
  file_size_bytes: number | null
  status: DocumentStatus

  // Denormalized from OCR
  document_number: string | null
  variable_symbol: string | null
  constant_symbol: string | null
  supplier_name: string | null
  supplier_ico: string | null
  supplier_dic: string | null
  date_issued: string | null // YYYY-MM-DD
  date_due: string | null
  date_tax: string | null
  total_without_vat: number | null
  total_vat: number | null
  total_with_vat: number | null
  currency: string
  payment_type: string | null
  confidence_score: number | null
  accounting_number: string | null

  // OCR
  ocr_processed: boolean
  ocr_status: string | null
  ocr_data: Record<string, unknown> | null

  // Workflow
  uploaded_by: string | null
  uploaded_at: string
  upload_source: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null

  // Storage
  storage_path: string | null
  mime_type: string | null

  // Bank
  bank_account_id: string | null
}

// --- Filters & Pagination ---

export interface DocumentFilters {
  search: string
  types: DocumentType[]
  statuses: DocumentStatus[]
  dateFrom: string | null
  dateTo: string | null
  amountMin: number | null
  amountMax: number | null
  period: string | null
}

export const defaultDocumentFilters: DocumentFilters = {
  search: '',
  types: [],
  statuses: [],
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
  period: null,
}

export interface SortConfig {
  field: string
  dir: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface SearchSummary {
  total_amount: number
  total_vat: number
  by_type: Record<string, number>
  by_status: Record<string, number>
}

export interface SearchResult {
  documents: DocumentRegisterEntry[]
  pagination: PaginationState
  summary: SearchSummary
}

// --- Month/Year Summary (for document register navigation) ---

export interface MonthSummary {
  period: string // YYYY-MM
  count: number
  amount: number
  vat: number
  by_status: Record<string, number>
  by_type: Record<string, number>
}

export type MonthStatus = 'complete' | 'pending' | 'issues' | 'empty' | 'future'

export interface YearSummary {
  year: number
  months: Record<string, MonthSummary> // keyed by YYYY-MM
  yearly_total: { count: number; amount: number; vat: number }
  available_years: number[]
}

// --- Tax Filings ---

export type TaxFilingType =
  | 'dph'
  | 'kontrolni_hlaseni'
  | 'souhrnne_hlaseni'
  | 'dppo'
  | 'dpfo'
  | 'silnicni_dan'
  | 'dan_z_nemovitosti'

export type TaxFilingStatus =
  | 'not_filed'
  | 'in_preparation'
  | 'filed'
  | 'amended'
  | 'paid'
  | 'refund_requested'
  | 'refund_received'

export type FilingType = 'regular' | 'amended' | 'supplementary'

export interface TaxFiling {
  id: string
  company_id: string
  period: string // YYYY-MM for monthly, YYYY for annual
  type: TaxFilingType
  status: TaxFilingStatus
  filing_type: FilingType
  filing_reference: string | null
  filed_date: string | null
  amount: number | null
  tax_base: number | null
  deductible: number | null
  paid_date: string | null
  deadline: string | null
  prepared_by: string | null
  filed_by: string | null
  document_ids: string[]
  notes: string | null
}

// --- Bank Accounts ---

export interface BankAccount {
  id: string
  company_id: string
  account_number: string
  bank_code: string | null
  bank_name: string | null
  iban: string | null
  swift: string | null
  currency: string
  label: string | null
  import_format: string | null
  is_primary: boolean
  is_active: boolean
}

// --- Labels ---

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  bank_statement: 'Výpis z banky',
  expense_invoice: 'Přijatá faktura',
  income_invoice: 'Vydaná faktura',
  receipt: 'Účtenka',
  advance_invoice: 'Zálohová faktura',
  credit_note: 'Dobropis',
  proforma_invoice: 'Proforma',
  internal_document: 'Interní doklad',
  cash_receipt: 'Pokladní doklad',
  travel_order: 'Cestovní příkaz',
  payroll: 'Mzdový doklad',
  tax_document: 'Daňový doklad',
  contract: 'Smlouva',
  power_of_attorney: 'Plná moc',
  correspondence: 'Korespondence',
  annual_report: 'Účetní závěrka',
  other: 'Ostatní',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  missing: 'Chybí',
  uploaded: 'Nahráno',
  extracting: 'Vytěžování...',
  extracted: 'Vytěženo',
  approved: 'Schváleno',
  rejected: 'Zamítnuto',
  booked: 'Zaúčtováno',
}

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string }> = {
  missing: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  uploaded: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  extracting: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  extracted: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  booked: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
}

export const TAX_FILING_TYPE_LABELS: Record<TaxFilingType, string> = {
  dph: 'Přiznání DPH',
  kontrolni_hlaseni: 'Kontrolní hlášení',
  souhrnne_hlaseni: 'Souhrnné hlášení',
  dppo: 'Daň z příjmů PO',
  dpfo: 'Daň z příjmů FO',
  silnicni_dan: 'Silniční daň',
  dan_z_nemovitosti: 'Daň z nemovitostí',
}

export const TAX_FILING_STATUS_LABELS: Record<TaxFilingStatus, string> = {
  not_filed: 'Nepodáno',
  in_preparation: 'V přípravě',
  filed: 'Podáno',
  amended: 'Dodatečné',
  paid: 'Zaplaceno',
  refund_requested: 'Nadm. odpočet',
  refund_received: 'Odpočet přijat',
}

export const TAX_FILING_STATUS_COLORS: Record<TaxFilingStatus, { bg: string; text: string }> = {
  not_filed: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  in_preparation: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  filed: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  amended: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  refund_requested: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  refund_received: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
}

// Extractable document types — types that go through OCR/AI pipeline
export const EXTRACTABLE_DOCUMENT_TYPES: DocumentType[] = [
  'expense_invoice', 'income_invoice', 'receipt', 'advance_invoice',
  'credit_note', 'proforma_invoice', 'cash_receipt', 'internal_document',
]

export function isExtractableType(type: DocumentType): boolean {
  return EXTRACTABLE_DOCUMENT_TYPES.includes(type)
}

// Document type prefixes for accounting numbers (Czech standard)
export const DOC_TYPE_PREFIXES: Record<string, string> = {
  expense_invoice: 'FP',   // Faktura přijatá
  income_invoice: 'FV',    // Faktura vydaná
  receipt: 'PP',            // Příjmový pokladní doklad
  cash_receipt: 'VP',       // Výdajový pokladní doklad
  internal_document: 'ID',  // Interní doklad
  bank_statement: 'BV',     // Bankovní výpis
  credit_note: 'IN',        // Dobropis (inkaso/nota)
  advance_invoice: 'ZF',    // Zálohová faktura
  other: 'OZ',              // Ostatní závazky
}
