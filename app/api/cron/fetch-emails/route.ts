import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchNewEmails, markAsProcessed } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

// POST: Cron job to fetch new emails from configured inboxes
export async function POST(request: Request) {
  // Verify cron secret or auth
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const userId = request.headers.get('x-user-id')

  // Allow either cron secret or authenticated admin
  if (!userId && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get active inboxes
    const { data: inboxes } = await supabaseAdmin
      .from('case_email_inboxes')
      .select('*')
      .eq('is_active', true)

    if (!inboxes || inboxes.length === 0) {
      return NextResponse.json({ message: 'No active inboxes', fetched: 0 })
    }

    // Get auto-assignment rules
    const { data: rules } = await supabaseAdmin
      .from('case_email_rules')
      .select('*')
      .eq('is_active', true)

    let totalFetched = 0
    let totalAutoAssigned = 0

    for (const inbox of inboxes) {
      const config = (inbox.config as Record<string, unknown>) || {}
      const lastSync = config.last_sync_at as string || undefined

      try {
        const emails = await fetchNewEmails(
          inbox.email_address,
          lastSync ? lastSync.split('T')[0] : undefined,
          50
        )

        for (const email of emails) {
          // Check if already exists
          const { data: existing } = await supabaseAdmin
            .from('case_emails')
            .select('id')
            .eq('external_message_id', email.id)
            .single()

          if (existing) continue

          // Try auto-assignment
          let projectId: string | null = null
          let companyId: string | null = null
          let status = 'unassigned'

          if (rules && rules.length > 0) {
            for (const rule of rules) {
              let match = false
              switch (rule.rule_type) {
                case 'sender':
                  match = email.from.toLowerCase().includes(rule.match_value.toLowerCase())
                  break
                case 'subject':
                  match = email.subject.toLowerCase().includes(rule.match_value.toLowerCase())
                  break
                case 'domain':
                  match = email.from.toLowerCase().endsWith(`@${rule.match_value.toLowerCase()}`)
                  break
              }
              if (match) {
                projectId = rule.target_project_id || null
                companyId = rule.target_company_id || null
                status = 'auto_assigned'
                totalAutoAssigned++
                break
              }
            }
          }

          // Insert email
          await supabaseAdmin.from('case_emails').insert({
            inbox_id: inbox.id,
            external_message_id: email.id,
            from_address: email.from,
            from_name: email.fromName,
            to_address: email.to,
            subject: email.subject,
            body_text: email.bodyText,
            body_html: email.bodyHtml,
            received_at: email.receivedAt,
            has_attachments: email.hasAttachments,
            attachments: email.attachments.map(a => ({
              filename: a.filename,
              mime_type: a.mimeType,
              size: a.size,
            })),
            project_id: projectId,
            company_id: companyId,
            assigned_at: status !== 'unassigned' ? new Date().toISOString() : null,
            status,
          })

          totalFetched++

          // Mark as processed in Gmail
          await markAsProcessed(email.id, 'UcetniApp/Processed')
        }

        // Update last_sync_at
        await supabaseAdmin
          .from('case_email_inboxes')
          .update({
            config: { ...config, last_sync_at: new Date().toISOString() },
          })
          .eq('id', inbox.id)
      } catch (err) {
        console.error(`Error fetching emails for ${inbox.email_address}:`, err)
      }
    }

    return NextResponse.json({
      message: 'Email sync complete',
      fetched: totalFetched,
      auto_assigned: totalAutoAssigned,
    })
  } catch (err) {
    console.error('Email cron error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
