import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapDbRowToInvoice } from '@/lib/invoice-utils'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'xlsx'
    const period = searchParams.get('period')
    const status = searchParams.get('status')

    // Fetch invoices
    let query = supabaseAdmin
      .from('invoices')
      .select('*')
      .is('deleted_at', null)
      .order('issue_date', { ascending: false })

    if (period) query = query.eq('period', period)

    const { data, error } = await query.limit(5000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let invoices = (data || []).map(mapDbRowToInvoice)

    if (status) {
      invoices = invoices.filter(inv => inv.status === status)
    }

    // Build Excel workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Ucetni WebApp'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Faktury')

    // Header row
    sheet.columns = [
      { header: 'Cislo', key: 'number', width: 18 },
      { header: 'Firma', key: 'company', width: 30 },
      { header: 'ICO', key: 'ico', width: 12 },
      { header: 'Datum vystaveni', key: 'issue_date', width: 14 },
      { header: 'Splatnost', key: 'due_date', width: 14 },
      { header: 'Zaklad (bez DPH)', key: 'base', width: 16 },
      { header: 'DPH', key: 'vat', width: 12 },
      { header: 'Celkem (s DPH)', key: 'total', width: 16 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Zaplaceno', key: 'paid_at', width: 14 },
      { header: 'VS', key: 'vs', width: 14 },
    ]

    // Style header
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E0F0' },
    }

    const statusLabels: Record<string, string> = {
      draft: 'Koncept',
      sent: 'Odeslano',
      paid: 'Zaplaceno',
      cancelled: 'Storno',
    }

    // Data rows
    for (const inv of invoices) {
      sheet.addRow({
        number: inv.invoice_number,
        company: inv.customer?.name || inv.company_name,
        ico: inv.customer?.ico || '',
        issue_date: inv.issue_date,
        due_date: inv.due_date,
        base: inv.total_without_vat,
        vat: inv.total_vat,
        total: inv.total_with_vat,
        status: statusLabels[inv.status] || inv.status,
        paid_at: inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('cs-CZ') : '',
        vs: inv.variable_symbol,
      })
    }

    // Number format for currency columns
    sheet.getColumn('base').numFmt = '#,##0.00'
    sheet.getColumn('vat').numFmt = '#,##0.00'
    sheet.getColumn('total').numFmt = '#,##0.00'

    if (format === 'csv') {
      const csvBuffer = await workbook.csv.writeBuffer()
      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="faktury-export.csv"`,
        },
      })
    }

    // Default: XLSX
    const xlsxBuffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(xlsxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="faktury-export.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Invoice export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
