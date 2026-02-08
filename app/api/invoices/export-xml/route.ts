import { NextRequest, NextResponse } from 'next/server'
import { generateInvoiceXml, generateBatchXml, validatePohodaXml } from '@/lib/pohoda-xml'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceIds, format = 'single' } = body

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid invoiceIds parameter' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .in('id', invoiceIds)

    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`)

    const invoices = data ?? []

    if (invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No invoices found' },
        { status: 404 }
      )
    }

    if (format === 'batch' || invoices.length > 1) {
      const batchXml = generateBatchXml(invoices)
      const validation = validatePohodaXml(batchXml)

      const files = invoices.map(invoice => ({
        name: `${invoice.invoice_number}.xml`,
        content: generateInvoiceXml(invoice),
      }))

      files.push({
        name: 'all-invoices.xml',
        content: batchXml,
      })

      return NextResponse.json({
        success: true,
        format: 'batch',
        count: invoices.length,
        validation,
        files: files.map(f => ({
          name: f.name,
          size: f.content.length,
          content: f.content,
        })),
      })
    } else {
      const invoice = invoices[0]
      const xml = generateInvoiceXml(invoice)

      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=Windows-1250',
          'Content-Disposition': `attachment; filename="${invoice.invoice_number}.xml"`,
        },
      })
    }
  } catch (error) {
    console.error('[/api/invoices/export-xml] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, company_name, total_with_vat, status, issue_date, pohoda_id')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`)

    const exportableInvoices = (data ?? []).map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      company_name: inv.company_name,
      total_with_vat: inv.total_with_vat,
      status: inv.status,
      issue_date: inv.issue_date,
      has_pohoda_id: !!inv.pohoda_id,
    }))

    return NextResponse.json({
      success: true,
      invoices: exportableInvoices,
      count: exportableInvoices.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list invoices',
      },
      { status: 500 }
    )
  }
}
