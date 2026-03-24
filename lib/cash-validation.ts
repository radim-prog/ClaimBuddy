/**
 * Cash transaction validation rules.
 * Czech legislation requirements for hotovostní platby.
 */

import type { CashTransaction, CashDocType } from '@/lib/types/bank-matching'

export interface CashValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

// Czech law: max 270 000 CZK cash payment per day per partner
const DAILY_CASH_LIMIT = 270_000

// DIČ required on receipts over 10 000 CZK
const DIC_REQUIRED_THRESHOLD = 10_000

// Standard Czech VAT rates
export const VAT_RATES = [21, 12, 0] as const
export type VatRate = (typeof VAT_RATES)[number]

/**
 * Validate a cash transaction before insert/update.
 * Returns array of validation errors (empty = valid).
 */
export function validateCashTransaction(
  tx: Partial<CashTransaction>,
  opts?: {
    dailyTotalForPartner?: number
    registerBalance?: number
  }
): CashValidationError[] {
  const errors: CashValidationError[] = []

  // Required fields
  if (!tx.doc_type || !['PPD', 'VPD'].includes(tx.doc_type)) {
    errors.push({ field: 'doc_type', message: 'Typ dokladu musí být PPD nebo VPD', severity: 'error' })
  }

  if (!tx.transaction_date) {
    errors.push({ field: 'transaction_date', message: 'Datum je povinné', severity: 'error' })
  }

  if (!tx.amount || tx.amount <= 0) {
    errors.push({ field: 'amount', message: 'Částka musí být kladná', severity: 'error' })
  }

  // Daily cash limit per partner (270 000 CZK)
  if (tx.amount && tx.counterparty_name) {
    const dailyTotal = (opts?.dailyTotalForPartner ?? 0) + tx.amount
    if (dailyTotal > DAILY_CASH_LIMIT) {
      errors.push({
        field: 'amount',
        message: `Překročen denní limit hotovostních plateb ${DAILY_CASH_LIMIT.toLocaleString('cs-CZ')} Kč pro jednoho partnera (zákon o omezení plateb v hotovosti)`,
        severity: 'error',
      })
    }
  }

  // DIČ required over 10 000 CZK
  if (tx.amount && tx.amount > DIC_REQUIRED_THRESHOLD && !tx.counterparty_name) {
    errors.push({
      field: 'counterparty_name',
      message: `U plateb nad ${DIC_REQUIRED_THRESHOLD.toLocaleString('cs-CZ')} Kč je doporučeno uvést partnera (pro daňovou uznatelnost)`,
      severity: 'warning',
    })
  }

  // Cash register balance check (VPD = výdej, balance must stay >= 0)
  if (tx.doc_type === 'VPD' && tx.amount && opts?.registerBalance != null) {
    if (opts.registerBalance - tx.amount < 0) {
      errors.push({
        field: 'amount',
        message: `Nedostatečný zůstatek v pokladně (${opts.registerBalance.toLocaleString('cs-CZ')} Kč). Výdaj ${tx.amount.toLocaleString('cs-CZ')} Kč by vytvořil záporný zůstatek.`,
        severity: 'error',
      })
    }
  }

  // Future date warning
  if (tx.transaction_date) {
    const txDate = new Date(tx.transaction_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (txDate > today) {
      errors.push({
        field: 'transaction_date',
        message: 'Datum je v budoucnosti',
        severity: 'warning',
      })
    }
  }

  return errors
}

/**
 * Calculate VAT breakdown from a gross amount.
 * Returns base + VAT for the given rate.
 */
export function calculateVatBreakdown(
  grossAmount: number,
  vatRate: VatRate
): { base: number; vat: number; gross: number } {
  if (vatRate === 0) {
    return { base: grossAmount, vat: 0, gross: grossAmount }
  }

  const base = Math.round((grossAmount / (1 + vatRate / 100)) * 100) / 100
  const vat = Math.round((grossAmount - base) * 100) / 100

  return { base, vat, gross: grossAmount }
}

/**
 * Determine most likely VAT rate for a cash transaction based on category.
 */
export function suggestVatRate(category?: string | null): VatRate {
  if (!category) return 21

  // Tax/insurance payments are VAT-exempt
  if (category.includes('tax_') || category.includes('insurance_') || category === 'vat_payment') {
    return 0
  }

  // Standard rate for most categories
  return 21
}

/**
 * Check daily cash total for a partner on a specific date.
 * Used to enforce the 270k limit.
 */
export async function getDailyPartnerTotal(
  supabaseAdmin: any,
  companyId: string,
  counterpartyName: string,
  date: string,
  excludeId?: string
): Promise<number> {
  let query = supabaseAdmin
    .from('cash_transactions')
    .select('amount')
    .eq('company_id', companyId)
    .eq('transaction_date', date)
    .ilike('counterparty_name', counterpartyName)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query

  if (!data || data.length === 0) return 0
  return data.reduce((sum: number, row: { amount: number }) => sum + Math.abs(row.amount), 0)
}
