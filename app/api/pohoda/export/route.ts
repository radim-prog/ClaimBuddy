import { NextRequest, NextResponse } from 'next/server'
import { mPohodaClient } from '@/lib/mpohoda-client'
import { mockInvoices, type Invoice } from '@/lib/mock-data'

/**
 * POST /api/pohoda/export
 *
 * Export faktury do mPohoda
 *
 * Body:
 * - invoiceId: string - ID faktury k exportu
 *
 * Response:
 * - success: boolean
 * - pohodaId?: string - ID vytvořené faktury v mPohoda
 * - error?: string - Chybová zpráva
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Missing invoiceId parameter' },
        { status: 400 }
      )
    }

    // Najít fakturu v mock datech
    // V produkci by se načítala z databáze
    const invoice = mockInvoices.find(inv => inv.id === invoiceId)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Export do mPohoda
    const result = await mPohodaClient.exportInvoice(invoice)

    if (result.success) {
      // V produkci by se uložil pohoda_id do databáze
      // invoice.pohoda_id = result.pohodaId

      return NextResponse.json({
        success: true,
        pohodaId: result.pohodaId,
        message: `Faktura ${invoice.invoice_number} úspěšně exportována do mPohoda`,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[/api/pohoda/export] Error:', error)
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
 * GET /api/pohoda/export
 *
 * Test připojení k mPohoda API
 */
export async function GET() {
  try {
    const isConnected = await mPohodaClient.testConnection()

    return NextResponse.json({
      connected: isConnected,
      message: isConnected
        ? 'mPohoda API připojení úspěšné'
        : 'Nelze se připojit k mPohoda API',
    })
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      },
      { status: 500 }
    )
  }
}
