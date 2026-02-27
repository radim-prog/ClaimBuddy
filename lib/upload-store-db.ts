import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateClosureStatus } from '@/lib/closure-store-db'
import { addActivity } from '@/lib/activity-store-db'

// Supabase-backed upload store
// Replaces lib/upload-store.ts (in-memory globalThis singleton)
// Uses documents table

export type DocumentType = 'bank_statement' | 'expense_invoice' | 'income_invoice' | 'receipt' | 'other'

export type UploadRecord = {
  id: string
  company_id: string
  period: string
  document_type: DocumentType
  file_name: string
  file_size: number
  uploaded_at: string
  uploaded_by: string | null
  storage_path: string | null
  mime_type: string | null
}

// Map document_type to closure status field
const typeToClosureField: Record<string, 'bank_statement_status' | 'expense_documents_status' | 'income_invoices_status'> = {
  bank_statement: 'bank_statement_status',
  expense_invoice: 'expense_documents_status',
  income_invoice: 'income_invoices_status',
  receipt: 'expense_documents_status',
}

export async function addUpload(data: Omit<UploadRecord, 'id' | 'uploaded_at'>): Promise<UploadRecord> {
  // Insert into documents table
  const { data: row, error } = await supabaseAdmin
    .from('documents')
    .insert({
      company_id: data.company_id,
      period: data.period,
      type: data.document_type,
      file_name: data.file_name,
      file_size_bytes: data.file_size,
      status: 'uploaded',
      uploaded_by: data.uploaded_by,
      uploaded_at: new Date().toISOString(),
      upload_source: 'web',
      storage_path: data.storage_path || null,
      mime_type: data.mime_type || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add upload: ${error.message}`)

  // Update closure status: missing → uploaded
  const closureField = typeToClosureField[data.document_type]
  if (closureField) {
    try {
      await updateClosureStatus(
        data.company_id,
        data.period,
        closureField,
        'uploaded',
        data.uploaded_by || 'system'
      )
    } catch (e) {
      // Non-critical - closure update can fail if no closure exists
      console.warn('Failed to update closure status:', e)
    }
  }

  // Add activity record
  try {
    await addActivity({
      type: 'closure_status_changed',
      company_id: data.company_id,
      company_name: '',
      title: 'Dokument nahrán klientem',
      description: `${data.file_name} (${data.document_type}) za období ${data.period}`,
      created_by: data.uploaded_by || 'system',
    })
  } catch (e) {
    console.warn('Failed to add activity:', e)
  }

  return {
    id: row.id,
    company_id: row.company_id,
    period: row.period,
    document_type: data.document_type,
    file_name: row.file_name,
    file_size: row.file_size_bytes || data.file_size,
    uploaded_at: row.uploaded_at || row.created_at,
    uploaded_by: data.uploaded_by,
    storage_path: row.storage_path || null,
    mime_type: row.mime_type || null,
  }
}

export async function getUploadsByCompany(companyId: string, period?: string): Promise<UploadRecord[]> {
  let query = supabaseAdmin
    .from('documents')
    .select('*')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false })

  if (period) query = query.eq('period', period)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch uploads: ${error.message}`)

  return (data ?? []).map(row => ({
    id: row.id,
    company_id: row.company_id,
    period: row.period,
    document_type: row.type as DocumentType,
    file_name: row.file_name,
    file_size: row.file_size_bytes || 0,
    uploaded_at: row.uploaded_at || row.created_at,
    uploaded_by: row.uploaded_by || '',
    storage_path: row.storage_path || null,
    mime_type: row.mime_type || null,
  }))
}

export async function getUploadCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  if (error) return 0
  return count || 0
}
