import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email-service'
import {
  deadlineApproaching,
  paymentReminder,
  wrapInLayout,
} from '@/lib/email-templates'

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
    const { to, subject, body: emailBody, template, company_id, name, deadline_type, due_date, company_name, invoice_number, amount } = body

    if (!to || !subject || !template) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, template' }, { status: 400 })
    }

    if (!VALID_TEMPLATES.includes(template)) {
      return NextResponse.json({ error: `Invalid template. Must be one of: ${VALID_TEMPLATES.join(', ')}` }, { status: 400 })
    }

    // Sanitize HTML — strip script tags and event handlers
    const sanitizeHtml = (html: string) => html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
    const safeBody = emailBody ? sanitizeHtml(emailBody) : undefined

    // Build email config from template type
    let html: string
    let text: string

    if (template === 'deadline_reminder') {
      const tpl = deadlineApproaching(
        name || to,
        deadline_type || subject,
        due_date || '',
        company_name || ''
      )
      html = tpl.html
      text = tpl.text
    } else if (template === 'unpaid_invoice' || template === 'missing_document_tax_impact') {
      const tpl = paymentReminder(
        2,
        name || to,
        invoice_number || subject,
        typeof amount === 'number' ? amount : parseFloat(amount || '0'),
        due_date || ''
      )
      html = tpl.html
      text = tpl.text
    } else if (template === 'invoice_due_reminder') {
      const tpl = paymentReminder(
        1,
        name || to,
        invoice_number || subject,
        typeof amount === 'number' ? amount : parseFloat(amount || '0'),
        due_date || ''
      )
      html = tpl.html
      text = tpl.text
    } else {
      // monthly_summary / missing_documents / generic fallback
      // Use provided emailBody if supplied, otherwise render generic wrapper
      if (safeBody) {
        html = safeBody
        text = safeBody.replace(/<[^>]+>/g, '')
      } else {
        const rows = Object.entries(body as Record<string, unknown>)
          .filter(([k]) => !['to', 'subject', 'template', 'company_id'].includes(k))
          .map(([k, v]) => `<tr>
            <td style="padding:6px 12px 6px 0;font-size:14px;color:#6b7280;white-space:nowrap;">${k}</td>
            <td style="padding:6px 0;font-size:14px;color:#111827;">${v}</td>
          </tr>`)
          .join('')
        html = wrapInLayout(
          subject,
          `<h2 style="margin:0 0 16px;font-size:22px;color:#111827;">${subject}</h2>
           <table cellpadding="0" cellspacing="0" style="width:100%;">${rows}</table>`
        )
        text = subject
      }
    }

    const result = await sendEmail({ to, subject, html, text })

    // Preserve existing notification_log format (channel-based) for backward compatibility
    // (email-service also logs per-recipient, but this log carries company_id context)
    await supabaseAdmin
      .from('notification_log')
      .insert({
        company_id: company_id || null,
        channel: 'email',
        template,
        status: result.success ? 'sent' : 'failed',
        metadata: { to, subject, provider: result.provider, ...(result.error && { error: result.error }) },
      })

    if (!result.success) {
      return NextResponse.json(
        { success: false, provider: result.provider, error: result.error },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, provider: result.provider, messageId: result.messageId })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
