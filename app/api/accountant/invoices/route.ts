import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapDbRowToInvoice, generateInvoiceNumber } from '@/lib/invoice-utils'

export const dynamic = 'force-dynamic'

// GET - list invoices (optional filters: period, company_id, status)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const companyId = searchParams.get('company_id')
    const status = searchParams.get('status') // frontend status: draft/sent/paid
    const overdue = searchParams.get('overdue') // 'true' = only overdue invoices
    const dueSoon = searchParams.get('due_soon') // 'true' = due within 7 days

    let query = supabaseAdmin
      .from('invoices')
      .select('*')
      .is('deleted_at', null)
      .order('issue_date', { ascending: false })

    if (period) query = query.eq('period', period)
    if (companyId) query = query.eq('company_id', companyId)

    // Overdue filter: unpaid invoices past due date
    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0]
      query = query
        .is('paid_at', null)
        .neq('payment_status', 'paid')
        .lt('due_date', today)
    }

    // Due soon filter: unpaid invoices due within 7 days (not yet overdue)
    if (dueSoon === 'true') {
      const today = new Date().toISOString().split('T')[0]
      const weekLater = new Date()
      weekLater.setDate(weekLater.getDate() + 7)
      const weekLaterStr = weekLater.toISOString().split('T')[0]
      query = query
        .is('paid_at', null)
        .neq('payment_status', 'paid')
        .gte('due_date', today)
        .lte('due_date', weekLaterStr)
    }

    const { data, error } = await query.limit(500)

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    let invoices = (data || []).map(mapDbRowToInvoice)

    // Filter by derived status (draft/sent/paid) after mapping
    if (status) {
      invoices = invoices.filter(inv => inv.status === status)
    }

    return NextResponse.json({ invoices, count: invoices.length })
  } catch (error) {
    console.error('Invoices API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create invoice
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validate required fields (company_id can be null for manual customers)
    if (!body.items || !body.items.length) {
      return NextResponse.json(
        { error: 'items are required' },
        { status: 400 }
      )
    }
    if (!body.company_id && !body.partner?.name && !body.company_name) {
      return NextResponse.json(
        { error: 'company_id or partner name is required' },
        { status: 400 }
      )
    }

    // Generate invoice number (supports multiple series)
    const year = new Date().getFullYear()
    const { invoiceNumber, variableSymbol, seriesId } = await generateInvoiceNumber(
      supabaseAdmin, year, body.number_series_id
    )

    // Enrich partner data from companies table
    let partner = body.partner || { name: body.company_name || '', address: '' }
    if (!partner.ico && body.company_id) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('name, ico, dic, address')
        .eq('id', body.company_id)
        .single()

      if (company) {
        partner = {
          name: company.name || partner.name,
          ico: company.ico,
          dic: company.dic,
          address: typeof company.address === 'object'
            ? `${company.address.street || ''}, ${company.address.city || ''} ${company.address.zip || ''}`.trim()
            : company.address || '',
        }
      }
    }

    // Calculate totals from items
    const items = body.items.map((item: any, i: number) => ({
      id: `item-${i}`,
      description: item.description || '',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'hod',
      unit_price: Number(item.unit_price) || 0,
      vat_rate: Number(item.vat_rate) || 0,
      total_without_vat: Number(item.total_without_vat) || (Number(item.quantity) * Number(item.unit_price)),
      total_with_vat: Number(item.total_with_vat) || 0,
    }))

    const totalWithoutVat = Number(body.total_without_vat) || items.reduce((s: number, i: any) => s + i.total_without_vat, 0)
    const totalVat = Number(body.total_vat) || Math.round(totalWithoutVat * 0.21)
    const totalWithVat = Number(body.total_with_vat) || totalWithoutVat + totalVat

    // Build invoice record
    const invoiceData: Record<string, unknown> = {
      company_id: body.company_id,
      company_name: body.company_name || '',
      type: body.type || 'income',
      invoice_number: invoiceNumber,
      variable_symbol: variableSymbol,
      issue_date: body.issue_date || new Date().toISOString().split('T')[0],
      due_date: body.due_date || addDays(new Date(), 14).toISOString().split('T')[0],
      tax_date: body.tax_date || body.issue_date || new Date().toISOString().split('T')[0],
      period: body.period || new Date().toISOString().substring(0, 7),
      partner,
      items,
      total_without_vat: totalWithoutVat,
      total_vat: totalVat,
      total_with_vat: totalWithVat,
      hourly_rate: body.hourly_rate || null,
      task_ids: body.task_ids || [],
      number_series_id: seriesId,
      constant_symbol: body.constant_symbol || null,
      specific_symbol: body.specific_symbol || null,
      notes: body.notes || null,
      footer_text: body.footer_text || null,
      payment_status: 'unpaid',
      created_by: userId,
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice:', error)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoice: mapDbRowToInvoice(data) }, { status: 201 })
  } catch (error) {
    console.error('Invoices POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
