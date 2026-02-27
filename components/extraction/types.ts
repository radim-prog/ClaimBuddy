/**
 * Shared types for dual-mode extraction system
 * Used by both client and accountant portals
 */

// Document types supported
export type ExtractionDocumentType = 
  | 'invoice' 
  | 'receipt' 
  | 'bank_statement' 
  | 'contract'
  | 'advance_invoice'
  | 'credit_note'

// Status flow for extraction
export type ExtractionStatus = 
  | 'uploaded'        // Initial state
  | 'extracting'      // OCR in progress
  | 'extracted'       // Data extracted, needs validation
  | 'validated'       // Data validated
  | 'corrected'       // User made corrections
  | 'submitted'       // Client submitted to accountant
  | 'reviewing'       // Accountant reviewing
  | 'approved'        // Accountant approved
  | 'rejected'        // Rejected
  | 'error'           // Extraction failed

// Source of extraction
export type ExtractionSource = 'client_upload' | 'drive_import' | 'bulk_process'

// Base extracted data (common fields)
export interface BaseExtractedData {
  document_number?: string
  variable_symbol?: string
  constant_symbol?: string
  date_issued?: string
  date_due?: string
  date_tax?: string
  supplier_name?: string
  supplier_ico?: string
  supplier_dic?: string
  description?: string
  total_amount?: number
  total_without_vat?: number
  total_vat?: number
  currency?: string
}

// Invoice-specific fields
export interface InvoiceExtractedData extends BaseExtractedData {
  document_type: 'invoice'
  items?: Array<{
    description: string
    quantity: number
    unit_price: number
    total_price: number
    vat_rate: number
  }>
}

// Receipt-specific fields
export interface ReceiptExtractedData extends BaseExtractedData {
  document_type: 'receipt'
  payment_type?: 'cash' | 'card' | 'transfer'
  receipt_number?: string
}

// Bank statement fields
export interface BankStatementExtractedData {
  document_type: 'bank_statement'
  account_number?: string
  bank_code?: string
  statement_number?: string
  period_from?: string
  period_to?: string
  transactions?: Array<{
    date: string
    description: string
    amount: number
    currency: string
    variable_symbol?: string
    constant_symbol?: string
    recipient_account?: string
  }>
}

// Contract fields
export interface ContractExtractedData {
  document_type: 'contract'
  contract_number?: string
  party_a?: string
  party_b?: string
  contract_type?: string
  valid_from?: string
  valid_to?: string
  subject?: string
}

// Union type for all extractions
export type ExtractedData = 
  | InvoiceExtractedData 
  | ReceiptExtractedData 
  | BankStatementExtractedData 
  | ContractExtractedData

// Main extraction record
export interface ExtractionRecord {
  id: string
  company_id: string
  company_name?: string
  file_name: string
  file_url?: string
  file_type: 'image' | 'pdf'
  document_type: ExtractionDocumentType
  status: ExtractionStatus
  source: ExtractionSource
  extracted_data?: ExtractedData
  confidence_score?: number
  corrections?: Array<{
    field: string
    original: unknown
    corrected: unknown
    timestamp: string
  }>
  submitted_by?: string      // Client user ID
  submitted_at?: string
  reviewed_by?: string       // Accountant user ID
  reviewed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Client submission payload
export interface ClientSubmission {
  company_id: string
  file: File
  document_type: ExtractionDocumentType
  extracted_data: ExtractedData
  corrections?: Array<{
    field: string
    original: unknown
    corrected: unknown
  }>
  notes?: string
}

// Accountant review payload
export interface AccountantReview {
  extraction_id: string
  action: 'approve' | 'reject' | 'correct'
  corrections?: Array<{
    field: string
    value: unknown
  }>
  generate_pohoda?: boolean
  notes?: string
}

// Mode for accountant view
export type AccountantExtractionMode = 'client_submissions' | 'bulk_processing'

// Filter options
export interface ExtractionFilters {
  status?: ExtractionStatus[]
  document_type?: ExtractionDocumentType[]
  company_id?: string
  date_from?: string
  date_to?: string
  source?: ExtractionSource[]
}

// Map Kimi AI ExtractedInvoice (nested) → frontend ExtractedData (flat)
// Used by both accountant and client extraction pages
export function mapKimiToExtractedData(raw: any): InvoiceExtractedData {
  return {
    document_type: 'invoice',
    document_number: raw.document_number || undefined,
    variable_symbol: raw.variable_symbol || undefined,
    constant_symbol: raw.constant_symbol || undefined,
    date_issued: raw.date_issued || undefined,
    date_due: raw.date_due || undefined,
    date_tax: raw.date_tax || undefined,
    supplier_name: raw.supplier?.name || raw.supplier_name || undefined,
    supplier_ico: raw.supplier?.ico || raw.supplier_ico || undefined,
    supplier_dic: raw.supplier?.dic || raw.supplier_dic || undefined,
    description: raw.description || undefined,
    total_amount: raw.total_with_vat ?? raw.total_amount ?? undefined,
    total_without_vat: raw.total_without_vat ?? undefined,
    total_vat: raw.total_vat ?? undefined,
    currency: raw.currency || undefined,
    items: Array.isArray(raw.items) ? raw.items.map((item: any) => ({
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0,
      vat_rate: item.vat_rate === 'none' ? 0 : item.vat_rate === 'low' ? 12 : item.vat_rate === 'high' ? 21 : Number(item.vat_rate) || 21,
    })) : undefined,
  }
}

// Stats for dashboard
export interface ExtractionStats {
  total: number
  by_status: Record<ExtractionStatus, number>
  by_document_type: Record<ExtractionDocumentType, number>
  avg_confidence: number
  pending_review: number
  today_submissions: number
}
