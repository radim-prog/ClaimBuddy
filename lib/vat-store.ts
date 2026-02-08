import { supabaseAdmin } from '@/lib/supabase-admin'
import type { VatReturn } from '@/lib/types/vat'

// Supabase-backed VAT returns store
// Replaces mockVatReturns from mock-data.ts

export async function getVatReturnsByCompany(companyId: string): Promise<VatReturn[]> {
  const { data, error } = await supabaseAdmin
    .from('vat_returns')
    .select('*')
    .eq('company_id', companyId)
    .order('period', { ascending: false })

  if (error) throw new Error(`Failed to fetch VAT returns: ${error.message}`)
  return (data ?? []).map(mapRow)
}

export async function getVatReturnsByPeriod(period: string): Promise<VatReturn[]> {
  const { data, error } = await supabaseAdmin
    .from('vat_returns')
    .select('*')
    .eq('period', period)
    .order('company_id')

  if (error) throw new Error(`Failed to fetch VAT returns: ${error.message}`)
  return (data ?? []).map(mapRow)
}

export async function getAllVatReturns(): Promise<VatReturn[]> {
  const { data, error } = await supabaseAdmin
    .from('vat_returns')
    .select('*')
    .order('period', { ascending: false })

  if (error) throw new Error(`Failed to fetch VAT returns: ${error.message}`)
  return (data ?? []).map(mapRow)
}

export async function updateVatReturn(
  id: string,
  updates: Partial<Pick<VatReturn, 'status' | 'filed_date' | 'amount' | 'paid_date' | 'notes'>>
): Promise<VatReturn | null> {
  const { data, error } = await supabaseAdmin
    .from('vat_returns')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to update VAT return: ${error.message}`)
  }
  return mapRow(data)
}

function mapRow(row: any): VatReturn {
  return {
    id: row.id,
    company_id: row.company_id,
    period: row.period,
    type: row.type || 'dph',
    status: row.status || 'not_filed',
    filed_date: row.filed_date,
    amount: row.amount,
    paid_date: row.paid_date,
    notes: row.notes,
  }
}
