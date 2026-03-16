/**
 * Auto-categorize document inbox attachments by filename + mime type heuristics.
 * Used for client-side display and accountant sorting suggestions.
 */

export type DocumentCategory = 'expense_invoice' | 'bank_statement' | 'receipt' | 'other'

interface CategoryResult {
  category: DocumentCategory
  confidence: 'high' | 'medium' | 'low'
  label_cs: string
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  expense_invoice: 'Faktura',
  bank_statement: 'Bankovní výpis',
  receipt: 'Účtenka',
  other: 'Ostatní',
}

// Filename patterns (case-insensitive)
const INVOICE_PATTERNS = [
  /faktur/i, /invoice/i, /fa[\-_\s]?\d/i, /doklad/i,
  /objedn[aá]vk/i, /dodac[ií]/i, /dan[ěe]?[\-_\s]?dok/i,
]

const BANK_STATEMENT_PATTERNS = [
  /v[yý]pis/i, /statement/i, /bank/i, /[úu]čet[\-_\s]?v[yý]pis/i,
  /transakce/i, /pohyb/i,
]

const RECEIPT_PATTERNS = [
  /[úu]čtenk/i, /receipt/i, /paragon/i, /pokladn/i,
  /blo[čc]ek/i, /potvr[zd]en/i,
]

// Mime-based hints
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const SPREADSHEET_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

export function autoCategorize(filename: string, mimeType: string): CategoryResult {
  const name = filename.toLowerCase()

  // 1. Check explicit filename patterns (highest confidence)
  for (const pattern of INVOICE_PATTERNS) {
    if (pattern.test(name)) {
      return { category: 'expense_invoice', confidence: 'high', label_cs: CATEGORY_LABELS.expense_invoice }
    }
  }

  for (const pattern of BANK_STATEMENT_PATTERNS) {
    if (pattern.test(name)) {
      return { category: 'bank_statement', confidence: 'high', label_cs: CATEGORY_LABELS.bank_statement }
    }
  }

  for (const pattern of RECEIPT_PATTERNS) {
    if (pattern.test(name)) {
      return { category: 'receipt', confidence: 'high', label_cs: CATEGORY_LABELS.receipt }
    }
  }

  // 2. Mime-type based heuristics (medium confidence)
  if (SPREADSHEET_MIMES.includes(mimeType)) {
    return { category: 'bank_statement', confidence: 'medium', label_cs: CATEGORY_LABELS.bank_statement }
  }

  if (mimeType === 'application/pdf') {
    // PDFs without matching name → likely invoice (most common)
    return { category: 'expense_invoice', confidence: 'low', label_cs: CATEGORY_LABELS.expense_invoice }
  }

  if (IMAGE_MIMES.includes(mimeType)) {
    // Photos → likely receipt
    return { category: 'receipt', confidence: 'medium', label_cs: CATEGORY_LABELS.receipt }
  }

  // 3. Fallback
  return { category: 'other', confidence: 'low', label_cs: CATEGORY_LABELS.other }
}

export function getCategoryLabel(category: DocumentCategory): string {
  return CATEGORY_LABELS[category] || 'Ostatní'
}
