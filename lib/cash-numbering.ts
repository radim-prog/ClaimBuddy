/**
 * Cash document numbering — auto-generates PPD/VPD numbers.
 * Format: PPD-2026-001, VPD-2026-042
 * Sequence is per company + doc_type + year.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { CashDocType } from '@/lib/types/bank-matching'

const DOC_NUMBER_RE = /^(PPD|VPD)-(\d{4})-(\d{3,})$/

/**
 * Generate next doc_number for a cash transaction.
 * Queries DB for the highest existing number in the same company/type/year.
 */
export async function generateCashDocNumber(
  companyId: string,
  docType: CashDocType,
  year: number
): Promise<string> {
  const prefix = `${docType}-${year}-`

  const { data } = await supabaseAdmin
    .from('cash_transactions')
    .select('doc_number')
    .eq('company_id', companyId)
    .eq('doc_type', docType)
    .like('doc_number', `${prefix}%`)
    .order('doc_number', { ascending: false })
    .limit(1)

  let nextSeq = 1
  if (data?.[0]?.doc_number) {
    const match = data[0].doc_number.match(DOC_NUMBER_RE)
    if (match) {
      nextSeq = parseInt(match[3], 10) + 1
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, '0')}`
}

/**
 * Validate doc_number format: PPD-YYYY-NNN or VPD-YYYY-NNN
 */
export function isValidDocNumber(docNumber: string): boolean {
  return DOC_NUMBER_RE.test(docNumber)
}

/**
 * Parse doc_number into components.
 */
export function parseDocNumber(docNumber: string): {
  type: CashDocType
  year: number
  sequence: number
} | null {
  const match = docNumber.match(DOC_NUMBER_RE)
  if (!match) return null

  return {
    type: match[1] as CashDocType,
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  }
}
