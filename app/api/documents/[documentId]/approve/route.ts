import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateReceivedInvoiceXml } from '@/lib/pohoda-xml'

export const dynamic = 'force-dynamic'

/**
 * POST /api/documents/[documentId]/approve
 * 
 * Schválí extrahovaný doklad a vygeneruje Pohoda XML.
 * Body:
 * - corrections: object - opravy dat (optional)
 * - generatePohoda: boolean - vygenerovat Pohoda XML? (default true)
 */
export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { corrections, generatePohoda = true } = body

    // Načtení dokumentu
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Aktualizace OCR dat s případnými opravami
    let ocrData = document.ocr_data || {}
    if (corrections) {
      ocrData = { ...ocrData, ...corrections }
    }

    // Aktualizace statusu
    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({
        ocr_data: ocrData,
        ocr_status: 'approved',
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: request.headers.get('x-user-name') || 'System',
      })
      .eq('id', documentId)

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`)
    }

    // Generování Pohoda XML
    let pohodaXml: string | null = null
    if (generatePohoda && ocrData) {
      try {
        pohodaXml = generateReceivedInvoiceXml(ocrData)
      } catch (pohodaError) {
        console.warn('Failed to generate Pohoda XML:', pohodaError)
      }
    }

    return NextResponse.json({
      success: true,
      documentId,
      status: 'approved',
      pohodaXml,
      message: 'Document approved successfully',
    })
  } catch (error) {
    console.error('Document approve API error:', error)
    return NextResponse.json(
      { 
        error: 'Approval failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
