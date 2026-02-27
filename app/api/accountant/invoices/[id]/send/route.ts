import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapDbRowToInvoice } from '@/lib/invoice-utils'
import { generatePaymentQR } from '@/lib/qr-payment'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { getSupplierInfo } from '@/lib/supplier-loader'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    // 1. Fetch invoice
    const { data: row, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = mapDbRowToInvoice(row)
    const supplier = await getSupplierInfo()

    // 2. Generate QR code
    let qrDataUrl: string | undefined
    try {
      const bankAccount = supplier.iban || supplier.bankAccount
      const result = await generatePaymentQR({
        amount: invoice.total_with_vat,
        bankAccount,
        variableSymbol: invoice.variable_symbol,
        message: `Faktura ${invoice.invoice_number}`,
        dueDate: invoice.due_date,
      }, { size: 200 })
      qrDataUrl = result.dataUrl
    } catch (e) {
      console.warn('QR generation failed:', e)
    }

    // 3. Render PDF
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({ invoice, supplier, qrDataUrl })
    )

    // 4. Send email via SendGrid (if configured)
    const sendgridKey = process.env.SENDGRID_API_KEY
    if (!sendgridKey) {
      // Log the attempt and mark as sent even without email provider
      await supabaseAdmin
        .from('invoices')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', id)

      await supabaseAdmin
        .from('notification_log')
        .insert({
          company_id: row.company_id,
          channel: 'email',
          template: 'invoice_send',
          status: 'logged',
          metadata: { to: email, invoice_number: invoice.invoice_number, provider: 'none' },
        })

      const { data: updatedRow } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

      return NextResponse.json({
        success: true,
        provider: 'none',
        message: 'Email provider not configured (SENDGRID_API_KEY). Invoice marked as sent.',
        invoice: updatedRow ? mapDbRowToInvoice(updatedRow) : invoice,
      })
    }

    // SendGrid send with PDF attachment
    const sgMail = (await import('@sendgrid/mail')).default
    sgMail.setApiKey(sendgridKey)

    const senderEmail = process.env.SENDGRID_FROM_EMAIL || supplier.email

    await sgMail.send({
      to: email,
      from: senderEmail,
      subject: `Faktura ${invoice.invoice_number} – ${supplier.name}`,
      html: `
        <p>Dobrý den,</p>
        <p>v příloze zasíláme fakturu <strong>${invoice.invoice_number}</strong> na částku <strong>${invoice.total_with_vat.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</strong>.</p>
        <p>Splatnost: <strong>${new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</strong></p>
        <p>Variabilní symbol: <strong>${invoice.variable_symbol}</strong></p>
        <br>
        <p>S pozdravem,<br>${supplier.name}</p>
      `,
      attachments: [
        {
          content: Buffer.from(pdfBuffer).toString('base64'),
          filename: `${invoice.invoice_number}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    })

    // 5. Update invoice sent_at
    await supabaseAdmin
      .from('invoices')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', id)

    // 6. Log
    await supabaseAdmin
      .from('notification_log')
      .insert({
        company_id: row.company_id,
        channel: 'email',
        template: 'invoice_send',
        status: 'sent',
        metadata: { to: email, invoice_number: invoice.invoice_number, provider: 'sendgrid' },
      })

    // 7. Return updated invoice
    const { data: updatedRow } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      provider: 'sendgrid',
      message: 'Invoice sent successfully',
      invoice: updatedRow ? mapDbRowToInvoice(updatedRow) : invoice,
    })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
