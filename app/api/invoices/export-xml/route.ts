import { NextRequest, NextResponse } from 'next/server'
import { generateInvoiceXml, generateBatchXml, validatePohodaXml } from '@/lib/pohoda-xml'
import { mockInvoices, type Invoice } from '@/lib/mock-data'

/**
 * POST /api/invoices/export-xml
 *
 * Export faktur do Pohoda XML formátu
 *
 * Body:
 * - invoiceIds: string[] - ID faktur k exportu
 * - format: 'single' | 'batch' - Formát exportu (výchozí: single)
 *
 * Response:
 * - Pro single: vrátí XML přímo
 * - Pro batch: vrátí JSON se seznamem souborů
 */
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

    // Najít faktury
    const invoices = mockInvoices.filter(inv => invoiceIds.includes(inv.id))

    if (invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No invoices found' },
        { status: 404 }
      )
    }

    // Generovat XML
    if (format === 'batch' || invoices.length > 1) {
      // Batch export - vrátit všechny faktury v jednom XML
      const batchXml = generateBatchXml(invoices)
      const validation = validatePohodaXml(batchXml)

      // Vytvořit seznam souborů pro stažení
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
          // V produkci by to byl base64 encoded content nebo URL ke stažení
          content: f.content,
        })),
      })
    } else {
      // Single export - vrátit XML přímo
      const invoice = invoices[0]
      const xml = generateInvoiceXml(invoice)
      const validation = validatePohodaXml(xml)

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

/**
 * GET /api/invoices/export-xml
 *
 * Získat seznam dostupných faktur pro export
 */
export async function GET() {
  try {
    // Vrátit seznam faktur které lze exportovat
    const exportableInvoices = mockInvoices.map(inv => ({
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
