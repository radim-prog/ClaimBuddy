import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  DocumentRegisterEntry,
  DocumentFilters,
  SortConfig,
  SearchResult,
} from '@/lib/types/document-register'

// --- Search & Pagination ---

const ALLOWED_SORT_FIELDS = [
  'uploaded_at', 'date_issued', 'total_with_vat', 'supplier_name',
  'document_number', 'accounting_number', 'type', 'status', 'period',
]

export async function searchDocuments(
  companyId: string,
  filters: DocumentFilters,
  page: number = 1,
  perPage: number = 50,
  sort: SortConfig = { field: 'uploaded_at', dir: 'desc' }
): Promise<SearchResult> {
  const offset = (page - 1) * perPage
  const safePerPage = Math.min(perPage, 100)
  const sortField = ALLOWED_SORT_FIELDS.includes(sort.field) ? sort.field : 'uploaded_at'

  // Build query
  let query = supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .is('deleted_at', null)

  // Full-text search (sanitized to prevent PostgREST filter injection)
  if (filters.search) {
    const sanitized = filters.search.replace(/[%_.,()\\]/g, '')
    if (sanitized) {
      const q = `%${sanitized}%`
      query = query.or(
        `supplier_name.ilike.${q},document_number.ilike.${q},variable_symbol.ilike.${q},supplier_ico.ilike.${q},file_name.ilike.${q},accounting_number.ilike.${q}`
      )
    }
  }

  // Type filter
  if (filters.types.length > 0) {
    query = query.in('type', filters.types)
  }

  // Status filter
  if (filters.statuses.length > 0) {
    query = query.in('status', filters.statuses)
  }

  // Period filter
  if (filters.period) {
    query = query.eq('period', filters.period)
  }

  // Date range
  if (filters.dateFrom) {
    query = query.gte('date_issued', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('date_issued', filters.dateTo)
  }

  // Amount range
  if (filters.amountMin !== null) {
    query = query.gte('total_with_vat', filters.amountMin)
  }
  if (filters.amountMax !== null) {
    query = query.lte('total_with_vat', filters.amountMax)
  }

  // Sort & paginate
  query = query
    .order(sortField, { ascending: sort.dir === 'asc' })
    .range(offset, offset + safePerPage - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Search documents failed: ${error.message}`)

  const documents = (data ?? []).map(mapDocumentRow)
  const total = count ?? 0

  // Compute total summary across ALL matching docs (not just current page)
  let summaryQuery = supabaseAdmin
    .from('documents')
    .select('total_with_vat, total_vat, type, status')
    .eq('company_id', companyId)
    .is('deleted_at', null)

  if (filters.search) {
    const sanitized = filters.search.replace(/[%_.,()\\]/g, '')
    if (sanitized) {
      const q = `%${sanitized}%`
      summaryQuery = summaryQuery.or(
        `supplier_name.ilike.${q},document_number.ilike.${q},variable_symbol.ilike.${q},supplier_ico.ilike.${q},file_name.ilike.${q},accounting_number.ilike.${q}`
      )
    }
  }
  if (filters.types.length > 0) summaryQuery = summaryQuery.in('type', filters.types)
  if (filters.statuses.length > 0) summaryQuery = summaryQuery.in('status', filters.statuses)
  if (filters.period) summaryQuery = summaryQuery.eq('period', filters.period)
  if (filters.dateFrom) summaryQuery = summaryQuery.gte('date_issued', filters.dateFrom)
  if (filters.dateTo) summaryQuery = summaryQuery.lte('date_issued', filters.dateTo)
  if (filters.amountMin !== null) summaryQuery = summaryQuery.gte('total_with_vat', filters.amountMin)
  if (filters.amountMax !== null) summaryQuery = summaryQuery.lte('total_with_vat', filters.amountMax)

  const { data: allDocs } = await summaryQuery

  const summary = {
    total_amount: 0,
    total_vat: 0,
    by_type: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
  }
  for (const d of allDocs || []) {
    summary.total_amount += Number(d.total_with_vat) || 0
    summary.total_vat += Number(d.total_vat) || 0
    summary.by_type[d.type] = (summary.by_type[d.type] || 0) + 1
    summary.by_status[d.status] = (summary.by_status[d.status] || 0) + 1
  }

  return {
    documents,
    pagination: {
      page,
      perPage: safePerPage,
      total,
      totalPages: Math.ceil(total / safePerPage),
    },
    summary,
  }
}

// --- Single Document ---

export async function getDocumentById(documentId: string): Promise<DocumentRegisterEntry | null> {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return mapDocumentRow(data)
}

// --- Bulk Update Status ---

export async function bulkUpdateStatus(
  documentIds: string[],
  status: 'approved' | 'rejected',
  reviewedBy: string,
  companyId: string,
  rejectionReason?: string
): Promise<number> {
  const updates: Record<string, unknown> = {
    status,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (status === 'rejected' && rejectionReason) {
    updates.rejection_reason = rejectionReason
  }

  const { data, error } = await supabaseAdmin
    .from('documents')
    .update(updates)
    .in('id', documentIds)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .select('id')

  if (error) throw new Error(`Bulk update failed: ${error.message}`)
  return data?.length ?? 0
}

// --- Auto-populate from OCR ---

export async function populateDenormalizedFields(
  documentId: string,
  ocrData: Record<string, unknown>
): Promise<void> {
  const supplier = ocrData.supplier as Record<string, unknown> | undefined

  const updates: Record<string, unknown> = {
    document_number: ocrData.document_number ?? null,
    variable_symbol: ocrData.variable_symbol ?? null,
    constant_symbol: ocrData.constant_symbol ?? null,
    supplier_name: supplier?.name ?? null,
    supplier_ico: supplier?.ico ?? null,
    supplier_dic: supplier?.dic ?? null,
    date_issued: ocrData.date_issued ?? null,
    date_due: ocrData.date_due ?? null,
    date_tax: ocrData.date_tax ?? null,
    total_without_vat: ocrData.total_without_vat ?? null,
    total_vat: ocrData.total_vat ?? null,
    total_with_vat: ocrData.total_with_vat ?? null,
    currency: ocrData.currency ?? 'CZK',
    payment_type: ocrData.payment_type ?? null,
    confidence_score: ocrData.confidence_score ?? null,
    ocr_processed: true,
    ocr_status: 'completed',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('documents')
    .update(updates)
    .eq('id', documentId)

  if (error) throw new Error(`Populate denormalized fields failed: ${error.message}`)
}

// --- Accounting Number Generator ---

export async function getNextAccountingNumber(
  companyId: string,
  docType: string,
  year: number
): Promise<string> {
  const prefixes: Record<string, string> = {
    expense_invoice: 'FP',
    income_invoice: 'FV',
    receipt: 'PP',
    cash_receipt: 'VP',
    internal_document: 'ID',
    bank_statement: 'BV',
    credit_note: 'IN',
    advance_invoice: 'ZF',
    other: 'OZ',
  }

  const prefix = prefixes[docType] || 'OZ'
  const yy = String(year).slice(-2)

  // Upsert sequence and increment
  const { data, error } = await supabaseAdmin
    .from('document_number_sequences')
    .upsert(
      {
        company_id: companyId,
        year,
        prefix,
        doc_type: docType,
        last_number: 1,
      },
      { onConflict: 'company_id,year,prefix' }
    )
    .select('last_number')
    .single()

  if (error) {
    // Fallback: just count existing documents
    const { count } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('type', docType)
      .gte('uploaded_at', `${year}-01-01`)
      .lt('uploaded_at', `${year + 1}-01-01`)

    const num = (count ?? 0) + 1
    return `${yy}${prefix}${String(num).padStart(3, '0')}`
  }

  // Increment for next call
  const nextNum = (data?.last_number ?? 0) + 1
  await supabaseAdmin
    .from('document_number_sequences')
    .update({ last_number: nextNum })
    .eq('company_id', companyId)
    .eq('year', year)
    .eq('prefix', prefix)

  return `${yy}${prefix}${String(data?.last_number ?? 1).padStart(3, '0')}`
}

// --- Row Mapper ---

function mapDocumentRow(row: Record<string, unknown>): DocumentRegisterEntry {
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    period: row.period as string,
    type: row.type as DocumentRegisterEntry['type'],
    file_name: row.file_name as string,
    file_size_bytes: row.file_size_bytes as number | null,
    status: row.status as DocumentRegisterEntry['status'],

    document_number: row.document_number as string | null,
    variable_symbol: row.variable_symbol as string | null,
    constant_symbol: row.constant_symbol as string | null,
    supplier_name: row.supplier_name as string | null,
    supplier_ico: row.supplier_ico as string | null,
    supplier_dic: row.supplier_dic as string | null,
    date_issued: row.date_issued as string | null,
    date_due: row.date_due as string | null,
    date_tax: row.date_tax as string | null,
    total_without_vat: row.total_without_vat as number | null,
    total_vat: row.total_vat as number | null,
    total_with_vat: row.total_with_vat as number | null,
    currency: (row.currency as string) || 'CZK',
    payment_type: row.payment_type as string | null,
    confidence_score: row.confidence_score as number | null,
    accounting_number: row.accounting_number as string | null,

    ocr_processed: (row.ocr_processed as boolean) || false,
    ocr_status: row.ocr_status as string | null,
    ocr_data: row.ocr_data as Record<string, unknown> | null,

    uploaded_by: row.uploaded_by as string | null,
    uploaded_at: row.uploaded_at as string,
    upload_source: row.upload_source as string | null,
    reviewed_by: row.reviewed_by as string | null,
    reviewed_at: row.reviewed_at as string | null,
    rejection_reason: row.rejection_reason as string | null,

    storage_path: row.storage_path as string | null,
    mime_type: row.mime_type as string | null,

    bank_account_id: row.bank_account_id as string | null,
  }
}
