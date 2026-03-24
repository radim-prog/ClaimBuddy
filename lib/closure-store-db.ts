import { supabaseAdmin } from '@/lib/supabase-admin'

// Supabase-backed closure store
// Replaces lib/closure-store.ts (in-memory) + getClosures() from mock-data
//
// Column mapping: old mock used "expense_documents_status",
// Supabase schema uses "expense_invoices_status" + "receipts_status".
// This store maps between them for backward compatibility.

export interface ClosureRecord {
  id: string
  company_id: string
  company_name: string | null
  period: string
  status: string
  bank_statement_status: string
  expense_documents_status: string  // mapped from expense_invoices_status
  income_invoices_status: string
  cash_documents_status: string
  cash_income: number
  cash_expense: number
  vat_payable: number | null
  income_tax_accrued: number | null
  social_insurance: number | null
  health_insurance: number | null
  reminder_count: number
  last_reminder_sent_at: string | null
  notes: string | null
  updated_by: string | null
  assigned_accountant_id: string | null
  created_at: string
  updated_at: string
}

// Map DB row → ClosureRecord (add expense_documents_status alias)
function mapRow(row: any): ClosureRecord {
  return {
    id: row.id,
    company_id: row.company_id,
    company_name: row.company_name,
    period: row.period,
    status: row.status,
    bank_statement_status: row.bank_statement_status || 'missing',
    expense_documents_status: row.expense_invoices_status || 'missing',
    income_invoices_status: row.income_invoices_status || 'missing',
    cash_documents_status: row.cash_documents_status || 'not_applicable',
    cash_income: row.cash_income ?? 0,
    cash_expense: row.cash_expense ?? 0,
    vat_payable: row.vat_payable,
    income_tax_accrued: row.income_tax_accrued,
    social_insurance: row.social_insurance ?? row.social_insurance_estimate,
    health_insurance: row.health_insurance ?? row.health_insurance_estimate,
    reminder_count: row.reminder_count || 0,
    last_reminder_sent_at: row.last_reminder_sent_at,
    notes: row.notes,
    updated_by: row.updated_by,
    assigned_accountant_id: row.assigned_accountant_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getClosures(filters?: {
  companyId?: string
  period?: string
}): Promise<ClosureRecord[]> {
  let query = supabaseAdmin.from('monthly_closures').select('*')

  if (filters?.companyId) query = query.eq('company_id', filters.companyId)
  if (filters?.period) query = query.eq('period', filters.period)

  query = query.order('period', { ascending: false })

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch closures: ${error.message}`)
  return (data ?? []).map(mapRow)
}

export async function getClosure(companyId: string, period: string): Promise<ClosureRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('monthly_closures')
    .select('*')
    .eq('company_id', companyId)
    .eq('period', period)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch closure: ${error.message}`)
  }
  return mapRow(data)
}

export async function getClosuresByCompany(companyId: string): Promise<ClosureRecord[]> {
  return getClosures({ companyId })
}

export type StatusField = 'bank_statement_status' | 'expense_documents_status' | 'income_invoices_status' | 'cash_documents_status'
export type StatusValue = 'missing' | 'uploaded' | 'approved' | 'reviewed' | 'skipped' | 'not_applicable'

// Map old field names to DB column names
function mapFieldToColumn(field: StatusField): string {
  if (field === 'expense_documents_status') return 'expense_invoices_status'
  return field
}

/**
 * V2: compute overall status including cash_documents_status.
 * 'not_applicable' is treated as done (company doesn't use cash).
 */
function computeOverallStatusV2(bank: string, expense: string, income: string, cash: string): string {
  const vals = [bank, expense, income]
  // Include cash only if it's actively tracked (not 'not_applicable')
  if (cash && cash !== 'not_applicable') vals.push(cash)

  const allDone = vals.every(v => v === 'approved' || v === 'reviewed' || v === 'skipped')
  const anyMissing = vals.some(v => v === 'missing')
  return allDone ? 'closed' : anyMissing ? 'open' : 'in_progress'
}

/**
 * Get cash transaction totals for a company+period.
 */
export async function getCashTotals(companyId: string, period: string): Promise<{
  income: number
  expense: number
  count: number
}> {
  const { data } = await supabaseAdmin
    .from('cash_transactions')
    .select('doc_type, amount')
    .eq('company_id', companyId)
    .eq('period', period)

  if (!data || data.length === 0) return { income: 0, expense: 0, count: 0 }

  let income = 0
  let expense = 0
  for (const row of data) {
    if (row.doc_type === 'PPD') income += Number(row.amount) || 0
    else expense += Number(row.amount) || 0
  }

  return { income, expense, count: data.length }
}

/**
 * Get closure detail with cash data included.
 */
export async function getClosureDetail(companyId: string, period: string): Promise<
  (ClosureRecord & { cash_totals: { income: number; expense: number; count: number } }) | null
> {
  const [closure, cashTotals] = await Promise.all([
    getClosure(companyId, period),
    getCashTotals(companyId, period),
  ])

  if (!closure) return null

  return { ...closure, cash_totals: cashTotals }
}

export async function updateClosureStatus(
  companyId: string,
  period: string,
  field: StatusField,
  value: StatusValue,
  updatedBy: string
): Promise<ClosureRecord | null> {
  // First get current closure
  const current = await getClosure(companyId, period)
  if (!current) return null

  const dbField = mapFieldToColumn(field)
  const updates: Record<string, any> = {
    [dbField]: value,
    updated_by: updatedBy,
    updated_at: new Date().toISOString(),
  }

  // Compute new overall status (V2 with cash)
  const newBank = field === 'bank_statement_status' ? value : current.bank_statement_status
  const newExpense = field === 'expense_documents_status' ? value : current.expense_documents_status
  const newIncome = field === 'income_invoices_status' ? value : current.income_invoices_status
  const newCash = field === 'cash_documents_status' ? value : current.cash_documents_status
  updates.status = computeOverallStatusV2(newBank, newExpense, newIncome, newCash)

  const { data, error } = await supabaseAdmin
    .from('monthly_closures')
    .update(updates)
    .eq('company_id', companyId)
    .eq('period', period)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update closure: ${error.message}`)
  return mapRow(data)
}

export async function updateClosureFull(
  closureId: string,
  updates: {
    bank_statement_status?: string
    expense_documents_status?: string
    income_invoices_status?: string
    notes?: string | null
    updated_by?: string
  }
): Promise<ClosureRecord | null> {
  const dbUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.bank_statement_status) dbUpdates.bank_statement_status = updates.bank_statement_status
  if (updates.expense_documents_status) dbUpdates.expense_invoices_status = updates.expense_documents_status
  if (updates.income_invoices_status) dbUpdates.income_invoices_status = updates.income_invoices_status
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes
  if (updates.updated_by) dbUpdates.updated_by = updates.updated_by

  // Get current to compute overall status
  const { data: current, error: fetchError } = await supabaseAdmin
    .from('monthly_closures')
    .select('*')
    .eq('id', closureId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch closure: ${fetchError.message}`)
  }
  if (!current) return null

  const newBank = dbUpdates.bank_statement_status || current.bank_statement_status || 'missing'
  const newExpense = dbUpdates.expense_invoices_status || current.expense_invoices_status || 'missing'
  const newIncome = dbUpdates.income_invoices_status || current.income_invoices_status || 'missing'
  const newCash = current.cash_documents_status || 'not_applicable'
  dbUpdates.status = computeOverallStatusV2(newBank, newExpense, newIncome, newCash)

  const { data, error } = await supabaseAdmin
    .from('monthly_closures')
    .update(dbUpdates)
    .eq('id', closureId)
    .select('*')
    .single()

  if (error) throw new Error(`Failed to update closure: ${error.message}`)
  return mapRow(data)
}

export async function upsertClosureField(
  companyId: string,
  period: string,
  field: StatusField,
  value: StatusValue,
  updatedBy: string
): Promise<ClosureRecord> {
  const existing = await getClosure(companyId, period)

  if (existing) {
    return (await updateClosureStatus(companyId, period, field, value, updatedBy))!
  }

  // Create new closure with the specified field
  const dbField = mapFieldToColumn(field)
  const insert: Record<string, any> = {
    company_id: companyId,
    period,
    status: 'open',
    bank_statement_status: 'missing',
    expense_invoices_status: 'missing',
    income_invoices_status: 'missing',
    [dbField]: value,
    updated_by: updatedBy,
  }

  const { data: row, error: insertError } = await supabaseAdmin
    .from('monthly_closures')
    .insert(insert)
    .select('*')
    .single()

  if (insertError) throw new Error(`Failed to create closure: ${insertError.message}`)
  return mapRow(row)
}
