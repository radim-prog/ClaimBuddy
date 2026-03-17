// Shared invoice utilities for DB ↔ frontend mapping
// Used by: /api/accountant/invoices, /api/accountant/invoicing, export-xml

// ============================================
// INVOICE ROUNDING
// ============================================

export type RoundingMode = 'none' | 'units' | 'halves' | 'tens'

/**
 * Round invoice total according to Czech accounting conventions.
 * - 'none': no rounding (return as-is)
 * - 'units': round to whole CZK (nearest 1 Kč)
 * - 'halves': round to nearest 0.50 Kč
 * - 'tens': round to nearest 10 Kč
 */
export function roundInvoiceTotal(amount: number, mode: RoundingMode): number {
  switch (mode) {
    case 'none':
      return amount
    case 'units':
      return Math.round(amount)
    case 'halves':
      return Math.round(amount * 2) / 2
    case 'tens':
      return Math.round(amount / 10) * 10
  }
}

/**
 * Calculate the rounding difference for display on invoice.
 * Returns positive value if rounded up, negative if rounded down.
 */
export function getRoundingDifference(amount: number, mode: RoundingMode): number {
  return Math.round((roundInvoiceTotal(amount, mode) - amount) * 100) / 100
}

import type { Invoice, InvoiceItem, InvoiceStatus, InvoiceType } from '@/lib/mock-data'
import type { SupabaseClient } from '@supabase/supabase-js'

// Derive frontend InvoiceStatus from DB payment_status + sent_at
export function getInvoiceStatus(row: {
  payment_status?: string | null
  sent_at?: string | null
  paid_at?: string | null
}): InvoiceStatus {
  if (row.paid_at || row.payment_status === 'paid') return 'paid'
  if (row.sent_at) return 'sent'
  return 'draft'
}

// Map DB invoice row to frontend Invoice type
export function mapDbRowToInvoice(row: any): Invoice {
  const typeMap: Record<string, InvoiceType> = {
    income: 'accountant_to_client',
    expense: 'client_to_customer',
  }

  const items: InvoiceItem[] = (row.items || []).map((item: any, i: number) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    const rate = Number(item.vat_rate) || 0
    const base = Number(item.total_without_vat) || qty * price
    const withVat = Number(item.total_with_vat) || Number(item.total) || Math.round(base * (1 + rate / 100) * 100) / 100
    return {
      id: item.id || `item-${i}`,
      description: item.description || '',
      quantity: qty,
      unit: item.unit || 'ks',
      unit_price: price,
      vat_rate: rate,
      total_without_vat: base,
      total_with_vat: withVat,
      task_id: item.task_id,
      discount_type: item.discount_type || undefined,
      discount_value: item.discount_value ? Number(item.discount_value) : undefined,
      discount_amount: item.discount_amount ? Number(item.discount_amount) : undefined,
    }
  })

  return {
    id: row.id,
    type: typeMap[row.type] || 'accountant_to_client',
    company_id: row.company_id,
    company_name: row.company_name || '',
    invoice_number: row.invoice_number,
    variable_symbol: row.variable_symbol || row.invoice_number || '',
    issue_date: row.issue_date,
    due_date: row.due_date,
    tax_date: row.tax_date || row.issue_date,
    customer: row.partner
      ? {
          name: row.partner.name || '',
          ico: row.partner.ico,
          dic: row.partner.dic,
          address: row.partner.address || '',
        }
      : undefined,
    items,
    total_without_vat: Number(row.total_without_vat) || 0,
    total_vat: Number(row.total_vat) || 0,
    total_with_vat: Number(row.total_with_vat) || 0,
    status: getInvoiceStatus(row),
    paid_at: row.paid_at,
    task_ids: row.task_ids || [],
    pohoda_id: row.pohoda_id,
    number_series_id: row.number_series_id,
    constant_symbol: row.constant_symbol,
    specific_symbol: row.specific_symbol,
    notes: row.notes,
    footer_text: row.footer_text,
    discount_type: row.discount_type,
    discount_value: row.discount_value ? Number(row.discount_value) : undefined,
    discount_total: row.discount_total ? Number(row.discount_total) : undefined,
    created_at: row.created_at,
    created_by: row.created_by,
    updated_at: row.updated_at,
  }
}

// Document type → number prefix mapping
const DOCUMENT_TYPE_PREFIX: Record<string, string> = {
  invoice: 'FV',
  proforma: 'ZF',
  credit_note: 'D',
  payment_request: 'VP',
}

export function getDocumentTypePrefix(documentType: string): string {
  return DOCUMENT_TYPE_PREFIX[documentType] || 'FV'
}

// Generate invoice number from configurable series
// Format tokens: {prefix}, {yyyy}, {nnnn} (zero-padded 4 digits)
// prefixOverride: when provided, uses this prefix instead of the series prefix (for proformas/credit notes)
export async function generateInvoiceNumber(
  supabase: SupabaseClient,
  year: number,
  seriesId?: string,
  prefixOverride?: string
): Promise<{ invoiceNumber: string; variableSymbol: string; seriesId: string }> {
  // Load series config from app_settings
  const { data: settingRow } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'invoice_number_series')
    .single()

  const allSeries = (settingRow?.setting_value && Array.isArray(settingRow.setting_value))
    ? settingRow.setting_value
    : [{ id: 'default', prefix: 'FV', format: '{prefix}-{yyyy}-{nnnn}', next_number: 1, active: true }]

  const series = seriesId
    ? allSeries.find((s: any) => s.id === seriesId && s.active)
    : allSeries.find((s: any) => s.active)

  if (!series) {
    throw new Error(`No active number series found${seriesId ? ` with id "${seriesId}"` : ''}`)
  }

  const prefix = prefixOverride || series.prefix || 'FV'
  const format: string = series.format || '{prefix}-{yyyy}-{nnnn}'

  // Find last used number from DB for this prefix+year combo
  const searchPrefix = `${prefix}-${year}-`
  const { data: lastRows } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${searchPrefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  const lastDbNum = lastRows?.[0]?.invoice_number
    ? parseInt(lastRows[0].invoice_number.replace(searchPrefix, ''), 10)
    : 0

  // Use the higher of series.next_number or last_in_db + 1
  const nextNum = Math.max(series.next_number || 1, lastDbNum + 1)

  // Build invoice number from format
  const padLen = (format.match(/\{n+\}/)?.[0]?.length ?? 6) - 2 // {nnnn} → 4
  const invoiceNumber = format
    .replace('{prefix}', prefix)
    .replace('{yyyy}', String(year))
    .replace(/\{n+\}/, String(nextNum).padStart(Math.max(padLen, 4), '0'))

  const variableSymbol = `${year}${String(nextNum).padStart(4, '0')}`

  // Atomically update next_number in the series config
  const updatedSeries = allSeries.map((s: any) =>
    s.id === series.id ? { ...s, next_number: nextNum + 1 } : s
  )
  await supabase
    .from('app_settings')
    .upsert({
      setting_key: 'invoice_number_series',
      setting_value: updatedSeries,
      updated_at: new Date().toISOString(),
    })

  return { invoiceNumber, variableSymbol, seriesId: series.id }
}

/**
 * Calculate item total after discount.
 * Used by invoice form to compute totals dynamically.
 */
export function calculateItemTotal(item: {
  quantity: number
  unit_price: number
  vat_rate: number
  discount_type?: 'percent' | 'amount'
  discount_value?: number
}): { total_without_vat: number; total_with_vat: number; discount_amount: number } {
  const base = item.quantity * item.unit_price
  let discountAmount = 0
  if (item.discount_value && item.discount_value > 0) {
    discountAmount = item.discount_type === 'percent'
      ? Math.round(base * item.discount_value / 100 * 100) / 100
      : Math.min(item.discount_value, base)
  }
  const afterDiscount = base - discountAmount
  const withVat = Math.round(afterDiscount * (1 + item.vat_rate / 100) * 100) / 100
  return { total_without_vat: afterDiscount, total_with_vat: withVat, discount_amount: discountAmount }
}
