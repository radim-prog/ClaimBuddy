export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, company, client_count, source } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Jméno a email jsou povinné' }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Neplatný email' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company?.trim() || null,
        client_count: client_count ? parseInt(client_count, 10) : null,
        source: source || 'website',
      })

    if (error) {
      // Duplicate email — still return success to not leak info
      if (error.code === '23505') {
        return NextResponse.json({ success: true })
      }
      console.error('Lead insert error:', error)
      return NextResponse.json({ error: 'Chyba při ukládání' }, { status: 500 })
    }

    // BOD-095: Notify admin about new lead (fire-and-forget, never block response)
    const adminEmail = process.env.ADMIN_EMAIL || 'radim.zajicek@icloud.com'
    const leadName = name.trim()
    const leadEmail = email.trim().toLowerCase()
    const leadCompany = company?.trim() || '—'
    const leadClients = client_count ? String(client_count) : '—'
    const leadSource = source || 'website'
    const timestamp = new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })

    sendEmail({
      to: adminEmail,
      subject: `Nový lead: ${leadName} (${leadEmail})`,
      html: `
        <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Nový lead zachycen</h2>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 12px;font-weight:600;color:#6b7280;">Jméno</td><td style="padding:8px 12px;color:#111827;">${leadName}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 12px;font-weight:600;color:#6b7280;">Email</td><td style="padding:8px 12px;color:#111827;">${leadEmail}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;color:#6b7280;">Firma</td><td style="padding:8px 12px;color:#111827;">${leadCompany}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 12px;font-weight:600;color:#6b7280;">Počet klientů</td><td style="padding:8px 12px;color:#111827;">${leadClients}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;color:#6b7280;">Zdroj</td><td style="padding:8px 12px;color:#111827;">${leadSource}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 12px;font-weight:600;color:#6b7280;">Čas</td><td style="padding:8px 12px;color:#111827;">${timestamp}</td></tr>
        </table>`,
      text: `Nový lead zachycen\n\nJméno: ${leadName}\nEmail: ${leadEmail}\nFirma: ${leadCompany}\nPočet klientů: ${leadClients}\nZdroj: ${leadSource}\nČas: ${timestamp}`,
    }).catch((err) => {
      console.error('[Leads] Failed to send admin notification:', err)
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Neplatný požadavek' }, { status: 400 })
  }
}
