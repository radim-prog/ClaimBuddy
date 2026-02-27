import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapDbRowToInvoice } from '@/lib/invoice-utils'
import { generatePaymentQR } from '@/lib/qr-payment'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { getSupplierInfo } from '@/lib/supplier-loader'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
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

    // 2. Generate QR code for payment
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
      console.warn('QR generation failed, continuing without QR:', e)
    }

    // 3. Render PDF to buffer
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({ invoice, supplier, qrDataUrl })
    )

    // 4. Return as downloadable PDF
    const filename = `${invoice.invoice_number}.pdf`
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
