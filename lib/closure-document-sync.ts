import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateClosureStatus, getClosure } from '@/lib/closure-store-db'
import type { StatusField } from '@/lib/closure-store-db'

const typeToClosureField: Record<string, StatusField> = {
  bank_statement: 'bank_statement_status',
  expense_invoice: 'expense_documents_status',
  income_invoice: 'income_invoices_status',
  receipt: 'expense_documents_status',
}

/**
 * After document deletion: check if any documents of that type remain.
 * If none → revert closure status to 'missing'.
 * Never overwrites 'reviewed', 'approved', or 'skipped' (manual decisions).
 */
export async function onDocumentDeleted(
  companyId: string,
  period: string,
  documentType: string,
  deletedBy?: string
): Promise<void> {
  const closureField = typeToClosureField[documentType]
  if (!closureField) return

  const { count } = await supabaseAdmin
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('period', period)
    .eq('type', documentType)
    .is('deleted_at', null)

  if ((count || 0) > 0) return

  const closure = await getClosure(companyId, period)
  if (!closure) return

  const currentStatus = closureField === 'bank_statement_status'
    ? closure.bank_statement_status
    : closureField === 'expense_documents_status'
      ? closure.expense_documents_status
      : closure.income_invoices_status

  if (currentStatus === 'reviewed' || currentStatus === 'approved' || currentStatus === 'skipped') {
    return
  }

  if (currentStatus === 'uploaded') {
    await updateClosureStatus(companyId, period, closureField, 'missing', deletedBy || 'system')
  }
}

/**
 * After document restore from trash: if closure status is 'missing', set to 'uploaded'.
 * Respects existing higher statuses.
 */
export async function onDocumentRestored(
  companyId: string,
  period: string,
  documentType: string,
  restoredBy?: string
): Promise<void> {
  const closureField = typeToClosureField[documentType]
  if (!closureField) return

  const closure = await getClosure(companyId, period)
  if (!closure) return

  const currentStatus = closureField === 'bank_statement_status'
    ? closure.bank_statement_status
    : closureField === 'expense_documents_status'
      ? closure.expense_documents_status
      : closure.income_invoices_status

  if (currentStatus === 'missing') {
    await updateClosureStatus(companyId, period, closureField, 'uploaded', restoredBy || 'system')
  }
}

/**
 * Soft-delete a document and sync closure status.
 * Use instead of direct .update({ deleted_at: ... }) on documents table.
 */
export async function softDeleteDocument(
  documentId: string,
  deletedBy: string
): Promise<void> {
  const { data: doc } = await supabaseAdmin
    .from('documents')
    .select('company_id, period, type')
    .eq('id', documentId)
    .single()

  if (!doc) return

  await supabaseAdmin
    .from('documents')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq('id', documentId)

  await onDocumentDeleted(doc.company_id, doc.period, doc.type, deletedBy)
}
