// Extraction types — shared between kimi-ai.ts and ai-extractor.ts

export type DocumentType = 'receivedInvoice' | 'receipt' | 'advanceInvoice' | 'creditNote'
export type PaymentType = 'cash' | 'creditcard' | 'draft' | 'wire'

export type SupplierInfo = {
  name: string
  ico: string | null
  dic: string | null
  address: string | null
  bank_account: string | null
  bank_code: string | null
}

export type InvoiceItem = {
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  vat_rate: 'none' | 'low' | 'high'  // 0%, 12%, 21%
  vat_amount: number
}

export type ExtractedInvoice = {
  // Document
  document_number: string
  variable_symbol: string | null
  constant_symbol: string | null
  specific_symbol: string | null

  // Dates
  date_issued: string        // YYYY-MM-DD
  date_tax: string          // YYYY-MM-DD
  date_due: string          // YYYY-MM-DD
  date_payment: string | null

  // Types
  document_type: DocumentType
  payment_type: PaymentType

  // Supplier
  supplier: SupplierInfo

  // Items
  items: InvoiceItem[]

  // Totals
  total_without_vat: number
  total_vat: number
  total_with_vat: number

  // VAT breakdown
  price_none: number
  price_low: number
  price_low_vat: number
  price_low_sum: number
  price_high: number
  price_high_vat: number
  price_high_sum: number

  // Metadata
  description: string
  currency: string

  // Confidence
  confidence_score: number
  field_confidence: {
    document_number: number
    date_issued: number
    date_tax: number
    date_due: number
    supplier_name: number
    ico: number
    total_with_vat: number
    vat_breakdown: number
  }

  // Provenance
  source_filename: string
  ocr_engine: string
  ocr_timestamp: string

  // Processing
  status: 'extracted' | 'validated' | 'corrected' | 'approved' | 'rejected'
  corrections?: CorrectionRecord[]
  knownIssuesApplied?: string[]
}

export type CorrectionRecord = {
  field: string
  originalValue: unknown
  correctedValue: unknown
  reason: string
  round: 1 | 2 | 3
  timestamp: string
}

export type ExtractionOptions = {
  model?: string
  temperature?: number
  maxTokens?: number
  confidenceThreshold?: number
}

export type RoundResult = {
  round: 1 | 2 | 3
  confidence: number
  changedFields: string[]
  corrections: CorrectionRecord[]
  duration_ms: number
}

export type BankStatementResult = {
  account_number: string
  bank_code: string
  statement_number: string | null
  period_from: string
  period_to: string
  opening_balance: number
  closing_balance: number
  transactions: Array<{
    date: string
    amount: number
    currency: string
    variable_symbol: string | null
    constant_symbol: string | null
    counterparty_account: string | null
    counterparty_name: string | null
    description: string
  }>
}

export function validateInvoiceStructure(
  invoice: Partial<ExtractedInvoice>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!invoice.document_number) errors.push('Missing document_number')
  if (!invoice.date_issued) errors.push('Missing date_issued')
  if (!invoice.total_with_vat && invoice.total_with_vat !== 0) {
    errors.push('Missing total_with_vat')
  }
  if (!invoice.supplier?.name) errors.push('Missing supplier.name')

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (invoice.date_issued && !dateRegex.test(invoice.date_issued)) {
    errors.push('Invalid date_issued format (expected YYYY-MM-DD)')
  }

  if (invoice.total_with_vat !== undefined && invoice.total_with_vat < 0) {
    errors.push('total_with_vat cannot be negative')
  }

  if (invoice.total_without_vat && invoice.total_vat && invoice.total_with_vat) {
    const calculated = invoice.total_without_vat + invoice.total_vat
    const tolerance = 0.01
    if (Math.abs(calculated - invoice.total_with_vat) > tolerance) {
      errors.push(`VAT math error: ${invoice.total_without_vat} + ${invoice.total_vat} ≠ ${invoice.total_with_vat}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
