// In-memory store for upload tracking
// Starts EMPTY - fills with real upload actions only.
// On upload: mutates mockMonthlyClosures to change status from 'missing' to 'uploaded'

import { mockMonthlyClosures } from '@/lib/mock-data'
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

// In-memory store
const uploads: UploadRecord[] = []
let uploadCounter = 0

// Map document_type to closure field name
const typeToClosureField: Record<string, string> = {
  bank_statement: 'bank_statement_status',
  expense_invoice: 'expense_documents_status',
  income_invoice: 'income_invoices_status',
  receipt: 'expense_documents_status', // receipts count as expense documents
}

export function addUpload(data: Omit<UploadRecord, 'id' | 'uploaded_at'>): UploadRecord {
  const record: UploadRecord = {
    ...data,
    id: `upload-${++uploadCounter}`,
    uploaded_at: new Date().toISOString(),
  }
  uploads.push(record)

  // Mutate closure status: missing → uploaded
  const closureField = typeToClosureField[data.document_type]
  if (closureField) {
    const closure = mockMonthlyClosures.find(
      c => c.company_id === data.company_id && c.period === data.period
    )
    if (closure && (closure as any)[closureField] === 'missing') {
      ;(closure as any)[closureField] = 'uploaded'
    }
  }

  // Add activity record
  addActivity({
    type: 'closure_status_changed',
    company_id: data.company_id,
    company_name: '', // Will be resolved by caller if needed
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
