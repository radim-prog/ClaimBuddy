/**
 * Sync ClaimBuddy data from the shared accounting database into the dedicated claims database.
 *
 * Usage:
 *   node scripts/sync-claimbuddy-db.js
 *   node scripts/sync-claimbuddy-db.js --dry-run
 *
 * Required source env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Required target env:
 *   NEXT_PUBLIC_CLAIMS_SUPABASE_URL
 *   CLAIMS_SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

const DRY_RUN = process.argv.includes('--dry-run')
const PAGE_SIZE = 1000

const SOURCE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SOURCE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TARGET_URL = process.env.NEXT_PUBLIC_CLAIMS_SUPABASE_URL
const TARGET_SERVICE_KEY = process.env.CLAIMS_SUPABASE_SERVICE_ROLE_KEY

if (!SOURCE_URL || !SOURCE_SERVICE_KEY) {
  throw new Error('Missing source DB envs: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

if (!TARGET_URL || !TARGET_SERVICE_KEY) {
  throw new Error('Missing target DB envs: NEXT_PUBLIC_CLAIMS_SUPABASE_URL and CLAIMS_SUPABASE_SERVICE_ROLE_KEY are required')
}

const source = createClient(SOURCE_URL, SOURCE_SERVICE_KEY)
const target = createClient(TARGET_URL, TARGET_SERVICE_KEY)

const USER_FIELDS = [
  'id', 'name', 'email', 'role', 'login_name', 'password_hash', 'permissions',
  'compensation_type', 'compensation_amount', 'plan_tier', 'stripe_customer_id',
  'status', 'verification_token', 'verification_token_expires', 'reset_token',
  'reset_token_expires', 'modules', 'firm_id', 'is_system_admin', 'phone',
  'phone_number', 'avatar_url', 'notification_preferences', 'last_login_at',
  'telegram_chat_id', 'ecomail_subscriber_id', 'marketing_consent_at',
  'signi_api_key', 'weekly_hours_capacity', 'work_schedule', 'gdpr_consent_at',
  'gdpr_consent_version', 'deleted_at', 'deletion_requested_at',
  'deletion_cancel_token', 'created_at', 'updated_at',
]

const COMPANY_FIELDS = [
  'id', 'name', 'ico', 'dic', 'legal_form', 'address', 'email', 'phone',
  'managing_director', 'claims_email', 'claims_phone', 'status', 'owner_id',
  'assigned_accountant_id', 'vat_payer', 'vat_period', 'pohoda_id',
  'bank_account', 'billing_settings', 'reliability_score', 'pohoda_years',
  'invoice_stats', 'total_revenue', 'has_employees', 'group_name',
  'monthly_reporting', 'notification_preferences', 'default_hourly_rate',
  'billing_note', 'accounting_start_date', 'raynet_company_id', 'health_score',
  'health_score_breakdown', 'health_score_updated_at', 'portal_sections',
  'firm_id', 'company_type', 'holding_notes', 'founded_date', 'description',
  'nickname', 'income_invoice_source', 'deleted_at', 'created_at', 'updated_at',
]

const ACCOUNTING_FIRM_FIELDS = [
  'id', 'name', 'ico', 'dic', 'email', 'phone', 'website', 'address',
  'logo_url', 'plan_tier', 'stripe_customer_id', 'billing_email',
  'signi_api_key', 'google_drive_credentials', 'settings',
  'marketplace_provider_id', 'status', 'onboarded_at', 'created_at', 'updated_at',
]

const DOCUMENT_FIELDS = [
  'id', 'company_id', 'period', 'type', 'file_name', 'google_drive_file_id',
  'mime_type', 'file_size_bytes', 'ocr_processed', 'ocr_status', 'ocr_data',
  'ocr_error', 'status', 'reviewed_by', 'reviewed_at', 'rejection_reason',
  'uploaded_by', 'uploaded_at', 'upload_source', 'created_at', 'updated_at',
  'deleted_at', 'document_number', 'variable_symbol', 'constant_symbol',
  'supplier_name', 'supplier_ico', 'supplier_dic', 'date_issued', 'date_due',
  'date_tax', 'total_without_vat', 'total_vat', 'total_with_vat', 'currency',
  'payment_type', 'confidence_score', 'accounting_number', 'bank_account_id',
  'storage_path', 'locked_by', 'locked_at', 'deleted_by',
  'travel_tagged', 'travel_session_id',
]

const MONTHLY_CLOSURE_FIELDS = [
  'id', 'company_id', 'period', 'status', 'bank_statement_status',
  'bank_statement_uploaded_at', 'bank_statement_file_url',
  'expense_invoices_status', 'expense_invoices_count', 'receipts_status',
  'receipts_count', 'income_invoices_status', 'income_invoices_count',
  'vat_payable', 'vat_due_date', 'income_tax_accrued',
  'social_insurance_estimate', 'health_insurance_estimate', 'closed_at',
  'closed_by', 'last_reminder_sent_at', 'reminder_count', 'created_at',
  'updated_at', 'assigned_accountant_id', 'company_name', 'vat_status', 'notes',
  'updated_by', 'social_insurance', 'health_insurance', 'cash_income',
  'cash_expense', 'cash_documents_status',
]

const TASK_FIELDS = [
  'id', 'title', 'description', 'company_id', 'assigned_to', 'created_by',
  'status', 'priority', 'due_date', 'completed_at', 'source',
  'whatsapp_message_id', 'attachments', 'created_at', 'updated_at', 'deleted_at',
  'project_id', 'phase_id', 'location_id', 'position_in_phase', 'is_next_action',
  'score_money', 'score_fire', 'score_time', 'score_distance', 'score_personal',
  'is_project', 'parent_project_id', 'project_outcome', 'gtd_context',
  'gtd_energy_level', 'gtd_is_quick_action', 'created_by_name',
  'assigned_to_name', 'company_name', 'is_waiting_for', 'waiting_for_who',
  'waiting_for_what', 'due_time', 'estimated_minutes', 'actual_minutes',
  'is_billable', 'hourly_rate', 'billable_hours', 'invoiced_amount', 'tags',
  'progress_percentage', 'task_data', 'total_score', 'position', 'deleted_by',
]

const CHAT_FIELDS = [
  'id', 'type', 'company_id', 'task_id', 'participants', 'last_message_at',
  'last_message_preview', 'created_at', 'channel', 'subject', 'status',
  'completed_at', 'started_by', 'waiting_since', 'last_responder',
]

const CHAT_MESSAGE_FIELDS = [
  'id', 'chat_id', 'sender_id', 'sender_name', 'sender_type', 'text',
  'ai_generated', 'ai_model', 'ai_confidence', 'attachments', 'read', 'read_at',
  'created_at',
]

const CLIENT_INVITATION_FIELDS = [
  'id', 'company_id', 'invited_email', 'invited_by', 'token', 'status',
  'expires_at', 'accepted_by', 'accepted_at', 'created_at', 'updated_at',
]

const INSURANCE_CASE_FIELDS = [
  'id', 'company_id', 'assigned_to', 'case_number', 'policy_number', 'claim_number',
  'insurance_company_id', 'insurance_type', 'event_date', 'event_description',
  'event_location', 'claimed_amount', 'approved_amount', 'paid_amount', 'status',
  'priority', 'deadline', 'note', 'tags', 'contact_name', 'contact_email',
  'contact_phone', 'contact_user_id', 'service_mode', 'payment_status',
  'payment_id', 'power_of_attorney_status', 'success_fee_percent', 'ai_report',
  'ai_processed_at', 'created_at', 'updated_at',
]

const CASE_DOCUMENT_FIELDS = [
  'id', 'case_id', 'name', 'file_path', 'file_size', 'mime_type',
  'document_type', 'uploaded_by', 'note', 'created_at',
]

const CASE_EVENT_FIELDS = [
  'id', 'case_id', 'event_type', 'actor', 'description', 'metadata',
  'visibility', 'attachment_url', 'created_at',
]

const PAYMENT_FIELDS = [
  'id', 'case_id', 'amount', 'payment_type', 'payment_date', 'reference',
  'note', 'created_by', 'created_at',
]

const CLAIM_REVIEW_FIELDS = [
  'id', 'case_id', 'token', 'rating', 'comment', 'client_name',
  'submitted_at', 'requested_at', 'requested_by', 'expires_at',
]

const SIGNING_JOB_FIELDS = [
  'id', 'insurance_case_id', 'company_id', 'created_by', 'document_name',
  'document_type', 'signature_type', 'status', 'note', 'signi_contract_id',
  'signed_at', 'signed_document_path', 'expires_at', 'created_at', 'updated_at',
]

const SIGNING_SIGNER_FIELDS = [
  'id', 'signing_job_id', 'name', 'email', 'phone', 'role', 'status',
  'signi_signer_id', 'signed_at', 'rejected_reason', 'order_index',
  'created_at', 'updated_at',
]

const SIGNING_EVENT_FIELDS = [
  'id', 'signing_job_id', 'event_type', 'actor', 'description', 'metadata',
  'created_at',
]

function chunk(values, size = 200) {
  const result = []
  for (let i = 0; i < values.length; i += size) {
    result.push(values.slice(i, i + size))
  }
  return result
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

function pick(row, allowedFields) {
  const result = {}
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(row, field)) {
      result[field] = row[field]
    }
  }
  return result
}

async function fetchAll(table) {
  const rows = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await source
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)

    if (!data || data.length === 0) break
    rows.push(...data)

    if (data.length < PAGE_SIZE) break
  }

  return rows
}

async function fetchByIn(table, column, values) {
  if (!values.length) return []

  const rows = []
  for (const ids of chunk(values)) {
    const { data, error } = await source
      .from(table)
      .select('*')
      .in(column, ids)

    if (error) throw new Error(`Failed to fetch ${table} by ${column}: ${error.message}`)
    if (data) rows.push(...data)
  }

  return rows
}

async function fetchByInOptional(table, column, values) {
  try {
    return await fetchByIn(table, column, values)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      message.includes('PGRST205') ||
      message.includes('42P01') ||
      message.toLowerCase().includes('does not exist')
    ) {
      console.warn(`- ${table}: source table not found, skipping`)
      return []
    }
    throw error
  }
}

async function upsertRows(table, rows, onConflict = 'id') {
  if (!rows.length) {
    console.log(`- ${table}: 0 rows`)
    return
  }

  console.log(`- ${table}: ${rows.length} rows${DRY_RUN ? ' [dry-run]' : ''}`)
  if (DRY_RUN) return

  for (const part of chunk(rows, 200)) {
    const { error } = await target
      .from(table)
      .upsert(part, { onConflict })

    if (error) throw new Error(`Failed to upsert ${table}: ${error.message}`)
  }
}

async function main() {
  console.log('=== ClaimBuddy DB Sync ===')
  console.log(`Mode: ${DRY_RUN ? 'dry-run' : 'write'}`)

  const insuranceCompanies = await fetchAll('insurance_companies')
  const insuranceCases = await fetchAll('insurance_cases')

  const caseIds = uniq(insuranceCases.map((row) => row.id))
  const companyIds = uniq(insuranceCases.map((row) => row.company_id))
  const userIdsFromCases = uniq(
    insuranceCases.flatMap((row) => [row.assigned_to, row.contact_user_id])
  )
  const companyContactEmails = new Map()

  for (const row of insuranceCases) {
    const email = row.contact_email?.trim().toLowerCase()
    if (!row.company_id || !email || companyContactEmails.has(row.company_id)) continue
    companyContactEmails.set(row.company_id, email)
  }

  const companies = await fetchByIn('companies', 'id', companyIds)
  const documents = await fetchByIn('documents', 'company_id', companyIds)
  const monthlyClosures = await fetchByIn('monthly_closures', 'company_id', companyIds)
  const tasks = await fetchByIn('tasks', 'company_id', companyIds)
  const chats = await fetchByIn('chats', 'company_id', companyIds)
  const clientInvitations = await fetchByInOptional('client_invitations', 'company_id', companyIds)
  const chatIds = uniq(chats.map((row) => row.id))
  const chatMessages = await fetchByIn('chat_messages', 'chat_id', chatIds)
  const companyEmails = uniq(companies.map((row) => row.email?.trim().toLowerCase()))
  const contactEmails = uniq(insuranceCases.map((row) => row.contact_email?.trim().toLowerCase()))
  const usersByEmail = await fetchByIn('users', 'email', uniq([...companyEmails, ...contactEmails]))
  const ownerIds = uniq(companies.map((row) => row.owner_id))
  const claimReviews = await fetchByIn('claim_reviews', 'case_id', caseIds)
  const reviewUserIds = uniq(claimReviews.map((row) => row.requested_by))

  const signingJobs = await fetchByIn('signing_jobs', 'insurance_case_id', caseIds)
  const signingJobIds = uniq(signingJobs.map((row) => row.id))
  const signingCreatedByIds = uniq(signingJobs.map((row) => row.created_by))

  const allUserIds = uniq([
    ...userIdsFromCases,
    ...ownerIds,
    ...reviewUserIds,
    ...signingCreatedByIds,
    ...documents.flatMap((row) => [row.uploaded_by, row.reviewed_by, row.locked_by, row.deleted_by]),
    ...tasks.flatMap((row) => [row.assigned_to, row.created_by, row.deleted_by]),
    ...clientInvitations.flatMap((row) => [row.invited_by, row.accepted_by]),
    ...chatMessages.map((row) => row.sender_id),
    ...usersByEmail.map((row) => row.id),
  ])

  const users = await fetchByIn('users', 'id', allUserIds)
  const firmIds = uniq([
    ...companies.map((row) => row.firm_id),
    ...users.map((row) => row.firm_id),
  ])
  const accountingFirms = await fetchByIn('accounting_firms', 'id', firmIds)
  const userIdByEmail = new Map(
    users
      .filter((row) => row.email)
      .map((row) => [row.email.trim().toLowerCase(), row.id])
  )

  const resolvedOwnerIdByCompanyId = new Map()
  for (const row of companies) {
    const companyEmail = row.email?.trim().toLowerCase()
    const derivedOwnerId =
      row.owner_id ||
      (companyEmail ? userIdByEmail.get(companyEmail) : null) ||
      userIdByEmail.get(companyContactEmails.get(row.id)) ||
      insuranceCases.find((insuranceCase) => insuranceCase.company_id === row.id)?.contact_user_id ||
      null

    if (derivedOwnerId) {
      resolvedOwnerIdByCompanyId.set(row.id, derivedOwnerId)
    }
  }

  const clientUsers = companies
    .map((row) => ({
      user_id: resolvedOwnerIdByCompanyId.get(row.id) || null,
      company_id: row.id,
      role: 'owner',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
    .filter((row) => row.user_id)
  const resolvedOwnerIds = uniq(clientUsers.map((row) => row.user_id))

  const insuranceCaseDocuments = await fetchByIn('insurance_case_documents', 'case_id', caseIds)
  const insuranceCaseEvents = await fetchByIn('insurance_case_events', 'case_id', caseIds)
  const insurancePayments = await fetchByIn('insurance_payments', 'case_id', caseIds)
  const signingSigners = await fetchByIn('signing_signers', 'signing_job_id', signingJobIds)
  const signingEvents = await fetchByIn('signing_events', 'signing_job_id', signingJobIds)

  const companyRows = companies.map((row) => ({
    ...pick(row, COMPANY_FIELDS),
    owner_id: resolvedOwnerIdByCompanyId.get(row.id) || row.owner_id || null,
    accounting_company_id: row.id,
    source_system: 'accounting',
  }))

  const userRows = users.map((row) => ({
    ...pick(row, USER_FIELDS),
    phone: row.phone ?? row.phone_number ?? null,
    accounting_user_id: row.id,
  }))

  const caseRows = insuranceCases.map((row) => ({
    ...pick(row, INSURANCE_CASE_FIELDS),
    accounting_company_id: row.company_id || null,
  }))

  console.log('')
  console.log('Sync order:')
  await upsertRows('insurance_companies', insuranceCompanies, 'code')
  await upsertRows('accounting_firms', accountingFirms)
  await upsertRows('users', userRows)
  await upsertRows('companies', companyRows)

  await upsertRows('client_users', clientUsers, 'user_id,company_id')

  await upsertRows('monthly_closures', monthlyClosures.map((row) => pick(row, MONTHLY_CLOSURE_FIELDS)))
  await upsertRows('documents', documents.map((row) => pick(row, DOCUMENT_FIELDS)))
  await upsertRows('tasks', tasks.map((row) => pick(row, TASK_FIELDS)))
  await upsertRows('chats', chats.map((row) => pick(row, CHAT_FIELDS)))
  await upsertRows('chat_messages', chatMessages.map((row) => pick(row, CHAT_MESSAGE_FIELDS)))
  await upsertRows('client_invitations', clientInvitations.map((row) => pick(row, CLIENT_INVITATION_FIELDS)))

  await upsertRows('insurance_cases', caseRows)
  await upsertRows('insurance_case_documents', insuranceCaseDocuments.map((row) => pick(row, CASE_DOCUMENT_FIELDS)))
  await upsertRows('insurance_case_events', insuranceCaseEvents.map((row) => pick(row, CASE_EVENT_FIELDS)))
  await upsertRows('insurance_payments', insurancePayments.map((row) => pick(row, PAYMENT_FIELDS)))
  await upsertRows('claim_reviews', claimReviews.map((row) => pick(row, CLAIM_REVIEW_FIELDS)))
  await upsertRows('signing_jobs', signingJobs.map((row) => pick(row, SIGNING_JOB_FIELDS)))
  await upsertRows('signing_signers', signingSigners.map((row) => pick(row, SIGNING_SIGNER_FIELDS)))
  await upsertRows('signing_events', signingEvents.map((row) => pick(row, SIGNING_EVENT_FIELDS)))

  console.log('')
  console.log('Summary:')
  console.log(`insurance_companies=${insuranceCompanies.length}`)
  console.log(`accounting_firms=${accountingFirms.length}`)
  console.log(`users=${users.length}`)
  console.log(`companies=${companyRows.length}`)
  console.log(`client_users=${clientUsers.length}`)
  console.log(`resolved_company_owners=${resolvedOwnerIds.length}`)
  console.log(`monthly_closures=${monthlyClosures.length}`)
  console.log(`documents=${documents.length}`)
  console.log(`tasks=${tasks.length}`)
  console.log(`chats=${chats.length}`)
  console.log(`chat_messages=${chatMessages.length}`)
  console.log(`client_invitations=${clientInvitations.length}`)
  console.log(`insurance_cases=${caseRows.length}`)
  console.log(`insurance_case_documents=${insuranceCaseDocuments.length}`)
  console.log(`insurance_case_events=${insuranceCaseEvents.length}`)
  console.log(`insurance_payments=${insurancePayments.length}`)
  console.log(`claim_reviews=${claimReviews.length}`)
  console.log(`signing_jobs=${signingJobs.length}`)
  console.log(`signing_signers=${signingSigners.length}`)
  console.log(`signing_events=${signingEvents.length}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
