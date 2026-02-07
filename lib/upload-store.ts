// In-memory store for upload tracking
// Starts EMPTY - fills with real upload actions only.
// On upload: uses closure-store to change status from 'missing' to 'uploaded'

import { updateClosureStatus } from '@/lib/closure-store'
import { addActivity } from '@/lib/activity-store'

export type DocumentType = 'bank_statement' | 'expense_invoice' | 'income_invoice' | 'receipt' | 'other'

export type UploadRecord = {
  id: string
  company_id: string
  period: string // YYYY-MM
  document_type: DocumentType
  file_name: string
  file_size: number
  uploaded_at: string
  uploaded_by: string
}

// globalThis singleton - ensures all API routes share the same store
const _storeKey = '__ucetni_upload_store'
function _getStore(): { uploads: UploadRecord[]; counter: number } {
  if (!(globalThis as any)[_storeKey]) {
    (globalThis as any)[_storeKey] = { uploads: [], counter: 0 }
  }
  return (globalThis as any)[_storeKey]
}
const uploads = _getStore().uploads

// Map document_type to closure field name
const typeToClosureField: Record<string, 'bank_statement_status' | 'expense_documents_status' | 'income_invoices_status'> = {
  bank_statement: 'bank_statement_status',
  expense_invoice: 'expense_documents_status',
  income_invoice: 'income_invoices_status',
  receipt: 'expense_documents_status', // receipts count as expense documents
}

export function addUpload(data: Omit<UploadRecord, 'id' | 'uploaded_at'>): UploadRecord {
  const record: UploadRecord = {
    ...data,
    id: `upload-${++_getStore().counter}`,
    uploaded_at: new Date().toISOString(),
  }
  uploads.push(record)

  // Update closure status: missing → uploaded (via shared closure-store)
  const closureField = typeToClosureField[data.document_type]
  if (closureField) {
    updateClosureStatus(
      data.company_id,
      data.period,
      closureField,
      'uploaded',
      data.uploaded_by
    )
  }

  // Add activity record
  addActivity({
    type: 'closure_status_changed',
    company_id: data.company_id,
    company_name: '',
    title: 'Dokument nahrán klientem',
    description: `${data.file_name} (${data.document_type}) za období ${data.period}`,
    created_by: data.uploaded_by,
  })

  return record
}

export function getUploadsByCompany(companyId: string, period?: string): UploadRecord[] {
  return uploads.filter(u =>
    u.company_id === companyId && (!period || u.period === period)
  )
}

export function getUploadCount(): number {
  return uploads.length
}
