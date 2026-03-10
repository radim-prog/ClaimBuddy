import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateInvoiceNumber, getDocumentTypePrefix } from '@/lib/invoice-utils'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/client/invoices/:id/convert
// body: { target_type: 'invoice' | 'credit_note' }
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { target_type } = body

  if (!target_type || !['invoice', 'credit_note'].includes(target_type)) {
    return NextResponse.json({ error: 'Invalid target_type. Must be "invoice" or "credit_note"' }, { status: 400 })
  }

  try {
    // Load source invoice
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const sourceDocType = source.document_type || 'invoice'

    // Validate conversion rules
    if (sourceDocType === 'credit_note') {
      return NextResponse.json({ error: 'Cannot convert a credit note' }, { status: 400 })
    }
    if (sourceDocType === 'invoice' && target_type === 'invoice') {
      return NextResponse.json({ error: 'Cannot convert invoice to invoice' }, { status: 400 })
    }
    if (sourceDocType === 'proforma' && target_type !== 'invoice') {
      return NextResponse.json({ error: 'Proforma can only be converted to invoice' }, { status: 400 })
    }

    // Generate new invoice number with correct prefix
    const year = new Date().getFullYear()
    const prefix = getDocumentTypePrefix(target_type)
    const { invoiceNumber, variableSymbol } = await generateInvoiceNumber(
      supabaseAdmin, year, undefined, prefix
    )

    // Prepare items — negate amounts for credit notes
    const multiplier = target_type === 'credit_note' ? -1 : 1
    const items = (source.items || []).map((item: any) => ({
      ...item,
      total_without_vat: (item.total_without_vat || 0) * multiplier,
      total_with_vat: (item.total_with_vat || 0) * multiplier,
      unit_price: (item.unit_price || 0) * multiplier,
    }))

    const newInvoice = {
      company_id: source.company_id,
      company_name: source.company_name,
      type: source.type,
      document_type: target_type,
      invoice_number: invoiceNumber,
      variable_symbol: variableSymbol,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      tax_date: new Date().toISOString().split('T')[0],
      period: new Date().toISOString().substring(0, 7),
      partner: source.partner,
      partner_id: source.partner_id,
      items,
      total_without_vat: (source.total_without_vat || 0) * multiplier,
      total_vat: (source.total_vat || 0) * multiplier,
      total_with_vat: (source.total_with_vat || 0) * multiplier,
      payment_method: source.payment_method,
      constant_symbol: source.constant_symbol,
      specific_symbol: source.specific_symbol,
      issued_by: source.issued_by,
      issued_by_phone: source.issued_by_phone,
      issued_by_email: source.issued_by_email,
      notes: source.notes,
      converted_from_id: source.id,
      number_series_id: source.number_series_id,
      payment_status: 'unpaid',
      created_by: userId,
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .insert(newInvoice)
      .select()
      .single()

    if (error) {
      console.error('Convert invoice error:', error)
      return NextResponse.json({ error: 'Failed to create converted invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoice: data }, { status: 201 })
  } catch (error) {
    console.error('Convert invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
