import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchNewEmails, downloadAttachment, parseRecipientSlug, markAsProcessed } from '@/lib/gmail'
import {
  getAllActiveInboxes,
  getDocumentInboxBySlug,
  addDocumentInboxItem,
  updateInboxSyncTime,
} from '@/lib/document-inbox-store'

export const dynamic = 'force-dynamic'

const DOCUMENT_EMAIL = process.env.DOCUMENT_INBOX_EMAIL || 'doklady@zajcon.cz'
const STORAGE_BUCKET = 'documents'
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

// POST: Manual sync trigger (same logic as cron, but triggered by accountant)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const inboxes = await getAllActiveInboxes()
    if (inboxes.length === 0) {
      return NextResponse.json({ message: 'No active inboxes', fetched: 0 })
    }

    const slugMap = new Map(inboxes.map(i => [i.slug, i]))
    const syncDates = inboxes.map(i => i.last_sync_at).filter(Boolean).sort()
    const sinceDate = syncDates.length > 0 ? syncDates[0]!.split('T')[0] : undefined

    const emails = await fetchNewEmails(DOCUMENT_EMAIL, sinceDate, 100)

    let fetched = 0
    const processedInboxIds = new Set<string>()

    for (const email of emails) {
      const slug = parseRecipientSlug(email.to)
      if (!slug) continue

      const inbox = slugMap.get(slug) || await getDocumentInboxBySlug(slug)
      if (!inbox) continue

      const { data: existing } = await supabaseAdmin
        .from('document_inbox_items')
        .select('id')
        .eq('email_message_id', email.id)
        .eq('inbox_id', inbox.id)
        .limit(1)

      if (existing && existing.length > 0) continue
      if (!email.hasAttachments || email.attachments.length === 0) continue

      for (const attachment of email.attachments) {
        if (!ALLOWED_MIME_TYPES.includes(attachment.mimeType)) continue

        try {
          const fileBuffer = await downloadAttachment(email.id, attachment.attachmentId)
          const storagePath = `inbox/${inbox.company_id}/${Date.now()}-${attachment.filename}`

          const { error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, fileBuffer, { contentType: attachment.mimeType, upsert: false })

          if (uploadError) continue

          await addDocumentInboxItem({
            inbox_id: inbox.id,
            company_id: inbox.company_id,
            email_message_id: email.id,
            from_address: email.from,
            from_name: email.fromName,
            subject: email.subject,
            received_at: email.receivedAt,
            filename: attachment.filename,
            mime_type: attachment.mimeType,
            file_size_bytes: attachment.size || fileBuffer.length,
            storage_path: storagePath,
          })

          fetched++
        } catch (err) {
          console.error(`[InboxSync] Error: ${attachment.filename}:`, err)
        }
      }

      processedInboxIds.add(inbox.id)
      await markAsProcessed(email.id, 'UcetniApp/DocInbox')
    }

    for (const inboxId of processedInboxIds) {
      await updateInboxSyncTime(inboxId)
    }

    return NextResponse.json({ fetched, emails_checked: emails.length })
  } catch (err) {
    console.error('[InboxSync] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
