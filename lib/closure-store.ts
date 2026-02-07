// Centrální store pro closure status změny
// Obě strany (klient i účetní) zapisují sem → mockMonthlyClosures se mutuje
// Takže obě strany vidí stejná data přes API

import { getClosures, type ClosureRecord } from '@/lib/mock-data'
import { addActivity } from '@/lib/activity-store'

type StatusField = 'bank_statement_status' | 'expense_documents_status' | 'income_invoices_status'
type StatusValue = 'missing' | 'uploaded' | 'approved'

export function updateClosureStatus(
  companyId: string,
  period: string,
  field: StatusField,
  value: StatusValue,
  updatedBy: string
): ClosureRecord | null {
  const closure = getClosures().find(
    c => c.company_id === companyId && c.period === period
  )
  if (!closure) return null

  ;(closure as any)[field] = value
  closure.updated_by = updatedBy
  closure.updated_at = new Date().toISOString()

  // Update overall status
  const allApproved =
    closure.bank_statement_status === 'approved' &&
    closure.expense_documents_status === 'approved' &&
    closure.income_invoices_status === 'approved'
  const anyMissing =
    closure.bank_statement_status === 'missing' ||
    closure.expense_documents_status === 'missing' ||
    closure.income_invoices_status === 'missing'

  closure.status = allApproved ? 'closed' : anyMissing ? 'open' : 'in_progress'

  return closure
}

export function updateClosureFull(
  closureId: string,
  updates: {
    bank_statement_status?: string
    expense_documents_status?: string
    income_invoices_status?: string
    notes?: string | null
    updated_by?: string
  }
): ClosureRecord | null {
  const closure = getClosures().find(c => c.id === closureId)
  if (!closure) return null

  if (updates.bank_statement_status) closure.bank_statement_status = updates.bank_statement_status
  if (updates.expense_documents_status) closure.expense_documents_status = updates.expense_documents_status
  if (updates.income_invoices_status) closure.income_invoices_status = updates.income_invoices_status
  if (updates.notes !== undefined) closure.notes = updates.notes
  if (updates.updated_by) closure.updated_by = updates.updated_by
  closure.updated_at = new Date().toISOString()

  // Update overall status
  const allApproved =
    closure.bank_statement_status === 'approved' &&
    closure.expense_documents_status === 'approved' &&
    closure.income_invoices_status === 'approved'
  const anyMissing =
    closure.bank_statement_status === 'missing' ||
    closure.expense_documents_status === 'missing' ||
    closure.income_invoices_status === 'missing'

  closure.status = allApproved ? 'closed' : anyMissing ? 'open' : 'in_progress'

  return closure
}

export function getClosure(companyId: string, period: string): ClosureRecord | undefined {
  return getClosures().find(
    c => c.company_id === companyId && c.period === period
  )
}
