import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  InsuranceCase,
  InsuranceCaseDocument,
  InsuranceCaseEvent,
  InsurancePayment,
  InsuranceCompany,
  CreateCaseInput,
  UpdateCaseInput,
} from '@/lib/types/insurance'
import { generateCaseNumber } from '@/lib/types/insurance'

// ============================================================
// CASES
// ============================================================

/**
 * Fetch insurance cases with optional filters and pagination.
 * Returns both the page of records and the total count.
 */
export async function getInsuranceCases(options: {
  assignedTo?: string
  companyId?: string
  status?: string
  insuranceCompanyId?: string
  search?: string
  priority?: string
  insuranceType?: string
  page?: number
  limit?: number
}): Promise<{ data: InsuranceCase[]; count: number }> {
  const {
    assignedTo,
    companyId,
    status,
    insuranceCompanyId,
    search,
    priority,
    insuranceType,
    page = 1,
    limit = 50,
  } = options

  let query = supabaseAdmin
    .from('insurance_cases')
    .select(
      `*,
       insurance_company:insurance_companies(*),
       company:companies!insurance_cases_company_id_fkey(id, name, ico),
       assigned_user:users!assigned_to(id, name)`,
      { count: 'exact' }
    )

  if (assignedTo) query = query.eq('assigned_to', assignedTo)
  if (companyId) query = query.eq('company_id', companyId)
  if (status) query = query.eq('status', status)
  if (insuranceCompanyId) query = query.eq('insurance_company_id', insuranceCompanyId)
  if (priority) query = query.eq('priority', priority)
  if (insuranceType) query = query.eq('insurance_type', insuranceType)

  if (search) {
    // Full-text search across case_number, policy_number and event_description
    query = query.or(
      `case_number.ilike.%${search}%,policy_number.ilike.%${search}%,event_description.ilike.%${search}%`
    )
  }

  const from = (page - 1) * limit
  query = query.order('created_at', { ascending: false }).range(from, from + limit - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Failed to fetch insurance cases: ${error.message}`)
  return { data: (data ?? []) as InsuranceCase[], count: count ?? 0 }
}

/**
 * Get a single insurance case by ID with full joins.
 * Returns null when the case does not exist (PGRST116).
 */
export async function getInsuranceCase(caseId: string): Promise<InsuranceCase | null> {
  const { data, error } = await supabaseAdmin
    .from('insurance_cases')
    .select(
      `*,
       insurance_company:insurance_companies(*),
       company:companies!insurance_cases_company_id_fkey(id, name, ico),
       assigned_user:users!assigned_to(id, name)`
    )
    .eq('id', caseId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch insurance case: ${error.message}`)
  }
  return data as InsuranceCase
}

/**
 * Create a new insurance case.
 * Auto-generates a sequential case_number (PU-YYYY-NNN) and logs a 'created' event.
 */
export async function createInsuranceCase(
  input: CreateCaseInput,
  createdBy: string
): Promise<InsuranceCase> {
  const year = new Date().getFullYear()

  // Determine the next sequence number for the current calendar year
  const { count: existingCount, error: countError } = await supabaseAdmin
    .from('insurance_cases')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`)

  if (countError) throw new Error(`Failed to count cases: ${countError.message}`)

  const caseNumber = generateCaseNumber((existingCount ?? 0) + 1)

  const { data, error } = await supabaseAdmin
    .from('insurance_cases')
    .insert({
      case_number: caseNumber,
      company_id: input.company_id ?? null,
      insurance_company_id: input.insurance_company_id ?? null,
      assigned_to: input.assigned_to ?? null,
      policy_number: input.policy_number ?? null,
      claim_number: input.claim_number ?? null,
      insurance_type: input.insurance_type,
      status: 'new',
      priority: input.priority ?? 'normal',
      event_date: input.event_date ?? null,
      event_description: input.event_description ?? null,
      event_location: input.event_location ?? null,
      claimed_amount: input.claimed_amount ?? null,
      approved_amount: null,
      paid_amount: 0,
      deadline: input.deadline ?? null,
      note: input.note ?? null,
      tags: input.tags ?? [],
    })
    .select(
      `*,
       insurance_company:insurance_companies(*),
       company:companies!insurance_cases_company_id_fkey(id, name, ico),
       assigned_user:users!assigned_to(id, name)`
    )
    .single()

  if (error) throw new Error(`Failed to create insurance case: ${error.message}`)

  // Log creation event — non-fatal if it fails
  try {
    await addCaseEvent({
      case_id: data.id,
      event_type: 'created',
      actor: createdBy,
      description: 'Spis vytvořen',
    })
  } catch (evtErr) {
    console.error(`[createInsuranceCase] Failed to log creation event for ${data.id}:`, evtErr)
  }

  return data as InsuranceCase
}

/**
 * Update an existing insurance case.
 * When the status changes, a 'status_change' event is logged automatically.
 */
export async function updateInsuranceCase(
  caseId: string,
  input: UpdateCaseInput,
  updatedBy: string
): Promise<InsuranceCase> {
  // Fetch current state before overwriting to detect status changes
  const existing = await getInsuranceCase(caseId)
  if (!existing) throw new Error(`Insurance case ${caseId} not found`)

  const { data, error } = await supabaseAdmin
    .from('insurance_cases')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', caseId)
    .select(
      `*,
       insurance_company:insurance_companies(*),
       company:companies!insurance_cases_company_id_fkey(id, name, ico),
       assigned_user:users!assigned_to(id, name)`
    )
    .single()

  if (error) throw new Error(`Failed to update insurance case: ${error.message}`)

  // Log status change event when the status field was explicitly changed
  if (input.status && input.status !== existing.status) {
    try {
      await addCaseEvent({
        case_id: caseId,
        event_type: 'status_change',
        actor: updatedBy,
        description: `Stav změněn: ${existing.status} → ${input.status}`,
        metadata: { from: existing.status, to: input.status },
      })
    } catch (evtErr) {
      console.error(`[updateInsuranceCase] Failed to log status change for ${caseId}:`, evtErr)
    }
  }

  return data as InsuranceCase
}

/**
 * Delete an insurance case.
 * Only cases in 'new' status may be deleted to prevent accidental data loss.
 */
export async function deleteInsuranceCase(caseId: string): Promise<void> {
  const existing = await getInsuranceCase(caseId)
  if (!existing) throw new Error(`Insurance case ${caseId} not found`)
  if (existing.status !== 'new') {
    throw new Error(
      `Cannot delete insurance case in status '${existing.status}'. Only 'new' cases can be deleted.`
    )
  }

  const { error } = await supabaseAdmin
    .from('insurance_cases')
    .delete()
    .eq('id', caseId)

  if (error) throw new Error(`Failed to delete insurance case: ${error.message}`)
}

// ============================================================
// DOCUMENTS
// ============================================================

/** Return all documents attached to a case, oldest first. */
export async function getCaseDocuments(caseId: string): Promise<InsuranceCaseDocument[]> {
  const { data, error } = await supabaseAdmin
    .from('insurance_case_documents')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch case documents: ${error.message}`)
  return (data ?? []) as InsuranceCaseDocument[]
}

/**
 * Attach a new document to a case and log a 'document_added' timeline event.
 */
export async function addCaseDocument(doc: {
  case_id: string
  name: string
  file_path: string
  file_size?: number
  mime_type?: string
  document_type: string
  uploaded_by: string
  note?: string
}): Promise<InsuranceCaseDocument> {
  const { data, error } = await supabaseAdmin
    .from('insurance_case_documents')
    .insert({
      case_id: doc.case_id,
      name: doc.name,
      file_path: doc.file_path,
      file_size: doc.file_size ?? null,
      mime_type: doc.mime_type ?? null,
      document_type: doc.document_type,
      uploaded_by: doc.uploaded_by,
      note: doc.note ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add case document: ${error.message}`)

  try {
    await addCaseEvent({
      case_id: doc.case_id,
      event_type: 'document_added',
      actor: doc.uploaded_by,
      description: `Přiložen dokument: ${doc.name}`,
      metadata: { document_id: data.id, document_type: doc.document_type },
    })
  } catch (evtErr) {
    console.error(
      `[addCaseDocument] Failed to log document event for case ${doc.case_id}:`,
      evtErr
    )
  }

  return data as InsuranceCaseDocument
}

/** Remove a document by its ID. */
export async function deleteCaseDocument(docId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('insurance_case_documents')
    .delete()
    .eq('id', docId)

  if (error) throw new Error(`Failed to delete case document: ${error.message}`)
}

// ============================================================
// EVENTS (timeline)
// ============================================================

/** Return the full event timeline for a case, newest first. */
export async function getCaseEvents(caseId: string): Promise<InsuranceCaseEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('insurance_case_events')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch case events: ${error.message}`)
  return (data ?? []) as InsuranceCaseEvent[]
}

/** Append a new timeline event to a case. */
export async function addCaseEvent(event: {
  case_id: string
  event_type: string
  actor: string
  description: string
  metadata?: Record<string, unknown>
}): Promise<InsuranceCaseEvent> {
  const { data, error } = await supabaseAdmin
    .from('insurance_case_events')
    .insert({
      case_id: event.case_id,
      event_type: event.event_type,
      actor: event.actor,
      description: event.description,
      metadata: event.metadata ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add case event: ${error.message}`)
  return data as InsuranceCaseEvent
}

// ============================================================
// PAYMENTS
// ============================================================

/** Return all payments for a case ordered by payment date ascending. */
export async function getCasePayments(caseId: string): Promise<InsurancePayment[]> {
  const { data, error } = await supabaseAdmin
    .from('insurance_payments')
    .select('*')
    .eq('case_id', caseId)
    .order('payment_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch case payments: ${error.message}`)
  return (data ?? []) as InsurancePayment[]
}

/**
 * Record a new payment (or refund) for a case.
 * After inserting, recalculates paid_amount on the parent case:
 *   paid_amount = SUM(non-refund payments) - SUM(refund payments)
 */
export async function addCasePayment(payment: {
  case_id: string
  amount: number
  payment_type: string
  payment_date: string
  reference?: string
  note?: string
  created_by: string
}): Promise<InsurancePayment> {
  const { data, error } = await supabaseAdmin
    .from('insurance_payments')
    .insert({
      case_id: payment.case_id,
      amount: payment.amount,
      payment_type: payment.payment_type,
      payment_date: payment.payment_date,
      reference: payment.reference ?? null,
      note: payment.note ?? null,
      created_by: payment.created_by,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add case payment: ${error.message}`)

  // Recalculate paid_amount by summing all payments for the case
  try {
    const { data: allPayments, error: sumError } = await supabaseAdmin
      .from('insurance_payments')
      .select('amount, payment_type')
      .eq('case_id', payment.case_id)

    if (sumError) throw sumError

    const paidAmount = (allPayments ?? []).reduce((acc, p) => {
      return p.payment_type === 'refund' ? acc - p.amount : acc + p.amount
    }, 0)

    const { error: updateError } = await supabaseAdmin
      .from('insurance_cases')
      .update({ paid_amount: paidAmount, updated_at: new Date().toISOString() })
      .eq('id', payment.case_id)

    if (updateError) throw updateError
  } catch (recalcErr) {
    console.error(
      `[addCasePayment] Failed to recalculate paid_amount for case ${payment.case_id}:`,
      recalcErr
    )
  }

  // Log timeline event
  try {
    await addCaseEvent({
      case_id: payment.case_id,
      event_type: 'payment_added',
      actor: payment.created_by,
      description: `Platba zaznamenána: ${payment.amount.toLocaleString('cs-CZ')} Kč (${payment.payment_type})`,
      metadata: {
        payment_id: data.id,
        amount: payment.amount,
        payment_type: payment.payment_type,
      },
    })
  } catch (evtErr) {
    console.error(
      `[addCasePayment] Failed to log payment event for case ${payment.case_id}:`,
      evtErr
    )
  }

  return data as InsurancePayment
}

// ============================================================
// INSURANCE COMPANIES
// ============================================================

/**
 * Return a list of insurance companies.
 * @param activeOnly - when true (default) only returns companies with active = true
 */
export async function getInsuranceCompanies(activeOnly = true): Promise<InsuranceCompany[]> {
  let query = supabaseAdmin.from('insurance_companies').select('*')

  if (activeOnly) query = query.eq('active', true)

  query = query.order('name')

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch insurance companies: ${error.message}`)
  return (data ?? []) as InsuranceCompany[]
}

/** Create a new insurance company record. */
export async function createInsuranceCompany(companyData: {
  name: string
  code?: string
  ico?: string
  address?: string
  phone?: string
  email?: string
  claims_email?: string
  claims_phone?: string
  web_url?: string
}): Promise<InsuranceCompany> {
  const { data, error } = await supabaseAdmin
    .from('insurance_companies')
    .insert({
      name: companyData.name,
      code: companyData.code ?? null,
      ico: companyData.ico ?? null,
      address: companyData.address ?? null,
      phone: companyData.phone ?? null,
      email: companyData.email ?? null,
      claims_email: companyData.claims_email ?? null,
      claims_phone: companyData.claims_phone ?? null,
      web_url: companyData.web_url ?? null,
      active: true,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Pojišťovna s tímto názvem nebo IČO již existuje`)
    }
    throw new Error(`Failed to create insurance company: ${error.message}`)
  }
  return data as InsuranceCompany
}

// ============================================================
// STATS
// ============================================================

/**
 * Aggregate statistics for the insurance cases module.
 * Optionally scoped to a single assigned user.
 *
 * active             — cases NOT in ('closed', 'cancelled')
 * waiting            — cases in ('under_review', 'additional_info')
 * resolved_this_month — cases in ('approved', 'closed') updated in current calendar month
 * success_rate       — approved / (approved + rejected) * 100
 */
export async function getInsuranceStats(assignedTo?: string): Promise<{
  total: number
  active: number
  waiting: number
  resolved_this_month: number
  total_claimed: number
  total_paid: number
  success_rate: number
}> {
  let query = supabaseAdmin
    .from('insurance_cases')
    .select('status, claimed_amount, paid_amount, updated_at')

  if (assignedTo) query = query.eq('assigned_to', assignedTo)

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch insurance stats: ${error.message}`)

  const cases = data ?? []

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let active = 0
  let waiting = 0
  let resolved_this_month = 0
  let total_claimed = 0
  let total_paid = 0
  let approved = 0
  let rejected = 0

  for (const c of cases) {
    if (c.status !== 'closed' && c.status !== 'cancelled') active++

    if (c.status === 'under_review' || c.status === 'additional_info') waiting++

    if (
      (c.status === 'approved' || c.status === 'closed') &&
      c.updated_at >= monthStart
    ) {
      resolved_this_month++
    }

    if (c.claimed_amount) total_claimed += c.claimed_amount
    total_paid += c.paid_amount ?? 0

    if (c.status === 'approved') approved++
    if (c.status === 'rejected') rejected++
  }

  const successDenominator = approved + rejected
  const success_rate =
    successDenominator > 0 ? Math.round((approved / successDenominator) * 100) : 0

  return {
    total: cases.length,
    active,
    waiting,
    resolved_this_month,
    total_claimed,
    total_paid,
    success_rate,
  }
}
