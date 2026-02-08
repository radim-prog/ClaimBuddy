import { NextRequest, NextResponse } from 'next/server'
import { mPohodaClient } from '@/lib/mpohoda-client'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

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

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const result = await mPohodaClient.exportInvoice(invoice)

    if (result.success) {
      // Update pohoda_id in database
      await supabaseAdmin
        .from('invoices')
        .update({ pohoda_id: result.pohodaId })
        .eq('id', invoiceId)

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
