import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const VALID_TEMPLATES = [
  'deadline_reminder',
  'unpaid_invoice',
  'missing_documents',
  'missing_document_tax_impact',
  'invoice_due_reminder',
  'monthly_summary',
]

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { to, subject, body: emailBody, template, company_id } = body

    if (!to || !subject || !emailBody || !template) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body, template' }, { status: 400 })
    }

    if (!VALID_TEMPLATES.includes(template)) {
      return NextResponse.json({ error: `Invalid template. Must be one of: ${VALID_TEMPLATES.join(', ')}` }, { status: 400 })
    }

    // Try SendGrid if configured
    const sendgridKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL

    if (sendgridKey && fromEmail) {
      try {
        const sgMail = (await import('@sendgrid/mail')).default
        sgMail.setApiKey(sendgridKey)

        await sgMail.send({
          to,
          from: fromEmail,
          subject,
          html: emailBody,
        })

        await supabaseAdmin
          .from('notification_log')
          .insert({
            company_id: company_id || null,
            channel: 'email',
            template,
            status: 'sent',
            metadata: { to, subject, provider: 'sendgrid' },
          })

        return NextResponse.json({ success: true, provider: 'sendgrid' })
      } catch (sgError) {
        console.error('[Email] SendGrid error:', sgError)
        // Fall through to log-only mode
      }
    }

    // Fallback: log only
    await supabaseAdmin
      .from('notification_log')
      .insert({
        company_id: company_id || null,
        channel: 'email',
        template,
        status: sendgridKey ? 'failed' : 'logged',
        metadata: { to, subject, body_length: emailBody.length, provider: 'none' },
      })

    return NextResponse.json({
      success: true,
      provider: 'none',
      message: sendgridKey ? 'SendGrid send failed, logged' : 'Email logged (provider not configured)',
    })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
