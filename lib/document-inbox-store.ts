import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

const DOMAIN = 'zajcon.cz'
const PREFIX = 'doklady'

export interface DocumentInbox {
  id: string
  company_id: string
  slug: string
  email_address: string
  is_active: boolean
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface DocumentInboxItem {
  id: string
  inbox_id: string
  company_id: string
  email_message_id: string | null
  from_address: string | null
  from_name: string | null
  subject: string | null
  received_at: string | null
  filename: string
  mime_type: string
  file_size_bytes: number
  storage_path: string | null
  status: 'pending' | 'processing' | 'imported' | 'failed' | 'ignored'
  document_id: string | null
  processed_at: string | null
  processed_by: string | null
  error_message: string | null
  created_at: string
}

// Generate random 6-char slug (lowercase alphanumeric)
function generateSlug(): string {
  return crypto.randomBytes(4).toString('hex').slice(0, 6)
}

// Create inbox for company with unique slug
export async function createDocumentInbox(companyId: string): Promise<DocumentInbox> {
  // Try up to 5 times to get a unique slug
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug()
    const emailAddress = `${PREFIX}+${slug}@${DOMAIN}`

    const { data, error } = await supabaseAdmin
      .from('document_inboxes')
      .insert({
        company_id: companyId,
        slug,
        email_address: emailAddress,
        is_active: true,
      })
      .select('*')
      .single()

    if (error) {
      // Duplicate slug — retry
      if (error.code === '23505' && attempt < 4) continue
      throw new Error(`Failed to create document inbox: ${error.message}`)
    }

    return data as DocumentInbox
  }

  throw new Error('Failed to generate unique slug after 5 attempts')
}

// Get inbox for a company
export async function getDocumentInbox(companyId: string): Promise<DocumentInbox | null> {
  const { data, error } = await supabaseAdmin
    .from('document_inboxes')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch document inbox: ${error.message}`)
  }
  return data as DocumentInbox
}

// Get inbox by slug (used in cron to resolve company)
export async function getDocumentInboxBySlug(slug: string): Promise<DocumentInbox | null> {
  const { data, error } = await supabaseAdmin
    .from('document_inboxes')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch inbox by slug: ${error.message}`)
  }
  return data as DocumentInbox
}

// Get all active inboxes
export async function getAllActiveInboxes(): Promise<DocumentInbox[]> {
  const { data, error } = await supabaseAdmin
    .from('document_inboxes')
    .select('*')
    .eq('is_active', true)

  if (error) throw new Error(`Failed to fetch active inboxes: ${error.message}`)
  return (data ?? []) as DocumentInbox[]
}

// Add inbox item (attachment from email)
export async function addDocumentInboxItem(item: {
  inbox_id: string
  company_id: string
  email_message_id: string
  from_address: string | null
  from_name: string | null
  subject: string | null
  received_at: string | null
  filename: string
  mime_type: string
  file_size_bytes: number
  storage_path: string
}): Promise<DocumentInboxItem> {
  const { data, error } = await supabaseAdmin
    .from('document_inbox_items')
    .insert({ ...item, status: 'pending' })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to add inbox item: ${error.message}`)
  return data as DocumentInboxItem
}

// Get inbox items for a company
export async function getDocumentInboxItems(
  companyId: string,
  status?: string,
  limit: number = 50
): Promise<DocumentInboxItem[]> {
  let query = supabaseAdmin
    .from('document_inbox_items')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch inbox items: ${error.message}`)
  return (data ?? []) as DocumentInboxItem[]
}

// Update inbox item status
export async function updateDocumentInboxItemStatus(
  itemId: string,
  status: 'processing' | 'imported' | 'failed' | 'ignored',
  extra?: { document_id?: string; processed_by?: string; error_message?: string }
): Promise<void> {
  const updates: Record<string, unknown> = { status }
  if (status === 'imported' || status === 'failed') {
    updates.processed_at = new Date().toISOString()
  }
  if (extra?.document_id) updates.document_id = extra.document_id
  if (extra?.processed_by) updates.processed_by = extra.processed_by
  if (extra?.error_message) updates.error_message = extra.error_message

  const { error } = await supabaseAdmin
    .from('document_inbox_items')
    .update(updates)
    .eq('id', itemId)

  if (error) throw new Error(`Failed to update inbox item: ${error.message}`)
}

// Update last_sync_at on inbox
export async function updateInboxSyncTime(inboxId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('document_inboxes')
    .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', inboxId)

  if (error) throw new Error(`Failed to update inbox sync time: ${error.message}`)
}

// Toggle inbox active state
export async function toggleDocumentInbox(inboxId: string, isActive: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from('document_inboxes')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', inboxId)

  if (error) throw new Error(`Failed to toggle inbox: ${error.message}`)
}

// Regenerate inbox slug (deactivate old, create new)
export async function regenerateInboxSlug(companyId: string): Promise<DocumentInbox> {
  // Deactivate existing
  await supabaseAdmin
    .from('document_inboxes')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('is_active', true)

  // Create new
  return createDocumentInbox(companyId)
}
