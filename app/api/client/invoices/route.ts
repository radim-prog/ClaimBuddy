import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapDbRowToInvoice, generateInvoiceNumber } from '@/lib/invoice-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get user's companies
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .is('deleted_at', null)

    const companyIds = (companies ?? []).map(c => c.id)
    if (companyIds.length === 0) {
      return NextResponse.json({ invoices: [], count: 0 })
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('issue_date', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)

    const invoices = (data ?? []).map(row => {
      const inv = mapDbRowToInvoice(row)
      return {
        id: inv.id,
        company_id: inv.company_id,
        invoice_number: inv.invoice_number,
        type: row.type,
        partner_name: row.partner?.name || '',
        partner: row.partner,
        amount: inv.total_with_vat,
        total_with_vat: inv.total_with_vat,
        currency: row.currency || 'CZK',
        issue_date: inv.issue_date,
        due_date: inv.due_date,
        status: inv.status,
      }
    })

    return NextResponse.json({ invoices, count: invoices.length })
  } catch (error) {
    console.error('Client invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - client creates an invoice
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { company_id, partner, items, issue_date, due_date, notes } = body

    if (!company_id || !partner?.name || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns this company
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .eq('owner_id', userId)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found or not owned by user' }, { status: 403 })
    }

    // Generate invoice number
    const year = new Date().getFullYear()
    const { invoiceNumber, variableSymbol, seriesId } = await generateInvoiceNumber(
      supabaseAdmin, year
    )

    // Calculate totals
    const invoiceItems = items.map((item: any, i: number) => ({
      id: `item-${i}`,
      description: item.description || '',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'ks',
      unit_price: Number(item.unit_price) || 0,
      vat_rate: Number(item.vat_rate) || 0,
      total_without_vat: Number(item.total_without_vat) || (Number(item.quantity) * Number(item.unit_price)),
      total_with_vat: Number(item.total_with_vat) || 0,
    }))

    const totalWithoutVat = Number(body.total_without_vat) || invoiceItems.reduce((s: number, i: any) => s + i.total_without_vat, 0)
    const totalVat = Number(body.total_vat) || Math.round(totalWithoutVat * 0.21 * 100) / 100
    const totalWithVat = Number(body.total_with_vat) || totalWithoutVat + totalVat

    const invoiceData = {
      company_id,
      company_name: company.name,
      type: 'income',
      invoice_number: invoiceNumber,
      variable_symbol: variableSymbol,
      issue_date: issue_date || new Date().toISOString().split('T')[0],
      due_date: due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      tax_date: issue_date || new Date().toISOString().split('T')[0],
      period: (issue_date || new Date().toISOString()).substring(0, 7),
      partner,
      items: invoiceItems,
      total_without_vat: totalWithoutVat,
      total_vat: totalVat,
      total_with_vat: totalWithVat,
      number_series_id: seriesId,
      notes: notes || null,
      payment_status: 'unpaid',
      created_by: userId,
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) {
      console.error('Create invoice error:', error)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoice: mapDbRowToInvoice(data),
    }, { status: 201 })
  } catch (error) {
    console.error('Client invoices POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
