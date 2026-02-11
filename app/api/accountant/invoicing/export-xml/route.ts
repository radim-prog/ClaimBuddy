import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generatePohodaXml } from '@/lib/pohoda-xml'
import type { Invoice, InvoiceItem } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') // YYYY-MM
  const companyId = searchParams.get('company_id')
  const invoiceIds = searchParams.get('ids') // comma-separated

  // Build query
  let query = supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('type', 'income')
    .order('issue_date', { ascending: true })

  if (invoiceIds) {
    query = query.in('id', invoiceIds.split(','))
  }
  if (companyId) {
    query = query.eq('company_id', companyId)
  }
  if (period) {
    const [year, month] = period.split('-')
    const startDate = `${year}-${month}-01`
    const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
    const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`
    query = query.gte('issue_date', startDate).lt('issue_date', endDate)
  }

  const { data: invoices, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ error: 'Žádné faktury k exportu' }, { status: 404 })
  }

  // Map DB rows to Invoice type
  const mappedInvoices: Invoice[] = invoices.map(row => ({
    id: row.id,
    type: row.type || 'accountant_to_client',
    company_id: row.company_id,
    company_name: row.company_name || '',
    invoice_number: row.invoice_number || '',
    variable_symbol: row.variable_symbol || row.invoice_number || '',
    issue_date: row.issue_date || '',
    due_date: row.due_date || '',
    tax_date: row.tax_date || row.issue_date || '',
    customer: row.partner ? {
      name: row.partner.name || '',
      ico: row.partner.ico,
      dic: row.partner.dic,
      address: row.partner.address || '',
    } : undefined,
    items: (row.items || []).map((item: Record<string, unknown>) => ({
      id: (item.id as string) || '',
      description: (item.description as string) || '',
      quantity: (item.quantity as number) || 1,
      unit: (item.unit as string) || 'ks',
      unit_price: (item.unit_price as number) || 0,
      vat_rate: (item.vat_rate as number) || 21,
      total_without_vat: (item.total_without_vat as number) || 0,
      total_with_vat: (item.total_with_vat as number) || 0,
    })) as InvoiceItem[],
    total_without_vat: row.total_without_vat || 0,
    total_vat: row.total_vat || 0,
    total_with_vat: row.total_with_vat || 0,
    status: row.payment_status === 'paid' ? 'paid' : row.payment_status === 'overdue' ? 'sent' : 'draft',
    paid_at: row.paid_at,
    task_ids: row.task_ids || [],
    pohoda_id: row.pohoda_id,
    created_at: row.created_at,
    created_by: row.created_by || '',
    updated_at: row.updated_at || row.created_at,
  }))

  const xml = generatePohodaXml(mappedInvoices)

  // Return XML as downloadable file
  const filename = period
    ? `pohoda-faktury-${period}.xml`
    : `pohoda-faktury-${new Date().toISOString().slice(0, 10)}.xml`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
