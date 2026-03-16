import { NextResponse } from 'next/server'
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
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
]

// POST: Cron job to fetch document emails and store attachments
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active document inboxes (to know which slugs are valid)
    const inboxes = await getAllActiveInboxes()
    if (inboxes.length === 0) {
      return NextResponse.json({ message: 'No active document inboxes', processed: 0 })
    }

    // Build slug→inbox map for quick lookup
    const slugMap = new Map(inboxes.map(i => [i.slug, i]))

    // Find the earliest last_sync_at across all inboxes
    const syncDates = inboxes
      .map(i => i.last_sync_at)
      .filter(Boolean)
      .sort()
    const sinceDate = syncDates.length > 0
      ? syncDates[0]!.split('T')[0]
      : undefined

    // Fetch emails sent to doklady+*@zajcon.cz
    const emails = await fetchNewEmails(
      DOCUMENT_EMAIL,
      sinceDate,
      100
    )

    let totalAttachments = 0
    let totalSkipped = 0
    const processedInboxIds = new Set<string>()

    for (const email of emails) {
      // Parse slug from recipient to find which company this is for
      const slug = parseRecipientSlug(email.to)
      if (!slug) {
        totalSkipped++
        continue
      }

      const inbox = slugMap.get(slug) || await getDocumentInboxBySlug(slug)
      if (!inbox) {
        totalSkipped++
        continue
      }

      // Check if already processed (by email message ID)
      const { data: existing } = await supabaseAdmin
        .from('document_inbox_items')
        .select('id')
        .eq('email_message_id', email.id)
        .eq('inbox_id', inbox.id)
        .limit(1)

      if (existing && existing.length > 0) continue

      // Process attachments
      if (!email.hasAttachments || email.attachments.length === 0) continue

      for (const attachment of email.attachments) {
        // Filter by allowed types
        if (!ALLOWED_MIME_TYPES.includes(attachment.mimeType)) continue

        try {
          // Download attachment
          const fileBuffer = await downloadAttachment(email.id, attachment.attachmentId)

          // Upload to Supabase Storage
          const storagePath = `inbox/${inbox.company_id}/${Date.now()}-${attachment.filename}`

          const { error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, fileBuffer, {
              contentType: attachment.mimeType,
              upsert: false,
            })

          if (uploadError) {
            console.error(`[DocInbox] Upload error for ${attachment.filename}:`, uploadError.message)
            continue
          }

          // Save item record
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

          totalAttachments++
        } catch (err) {
          console.error(`[DocInbox] Error processing attachment ${attachment.filename}:`, err)
        }
      }

      processedInboxIds.add(inbox.id)

      // Mark email as processed in Gmail
      await markAsProcessed(email.id, 'UcetniApp/DocInbox')
    }

    // Update last_sync_at for all processed inboxes
    for (const inboxId of processedInboxIds) {
      await updateInboxSyncTime(inboxId)
    }

    return NextResponse.json({
      message: 'Document email sync complete',
      emails_checked: emails.length,
      attachments_saved: totalAttachments,
      skipped: totalSkipped,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[DocInbox Cron] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
