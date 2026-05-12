import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email-service'
import { isStaffRole } from '@/lib/access-check'
import { getFirmId } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

// POST /api/accountant/send-reminder — send deadline/urgency email
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { to, subject, body: emailBody, companyId, companyName, period } = body

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Missing subject or body' }, { status: 400 })
    }

    // Resolve recipient email: explicit "to" or lookup from company owner
    let recipient = to
    if (!recipient && companyId) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('owner_id')
        .eq('id', companyId)
        .single()

      if (company?.owner_id) {
        const { data: owner } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', company.owner_id)
          .single()

        recipient = owner?.email
      }
    }

    if (!recipient) {
      return NextResponse.json({ error: 'No recipient email found' }, { status: 400 })
    }

    // Build HTML email
    const htmlBody = `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a56db;padding:24px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;">Pojistná Pomoc</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">${subject}</h2>
          <div style="font-size:15px;color:#374151;line-height:1.6;white-space:pre-line;">${emailBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <p style="margin:24px 0 0;">
            <a href="https://app.zajcon.cz/client/closures"
               style="display:inline-block;background:#1a56db;color:#ffffff;text-decoration:none;
                      padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
              Nahrát doklady
            </a>
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            Pojistná Pomoc · Automatická zpráva — neodpovídejte na tento email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

    const result = await sendEmail({
      to: recipient,
      subject,
      html: htmlBody,
      text: emailBody,
    })

    // Log activity
    const firmId = getFirmId(request)
    await supabaseAdmin.from('activities').insert({
      company_id: companyId || null,
      company_name: companyName || null,
      type: 'reminder_sent',
      channel: 'email',
      sent_by: userId,
      firm_id: firmId,
      notes: `Email: ${subject}${period ? ` (období ${period})` : ''}`,
    }).then(() => {}, () => {})

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      recipient,
    })
  } catch (error) {
    console.error('[SendReminder] Error:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}
