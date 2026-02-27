import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { populateDenormalizedFields } from '@/lib/document-store'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId, documentId } = params

  try {
    // Get document
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // If already has OCR data, use it to populate denormalized fields
    if (doc.ocr_data) {
      await populateDenormalizedFields(documentId, doc.ocr_data)
      return NextResponse.json({
        success: true,
        source: 'existing_ocr',
        message: 'Denormalized fields populated from existing OCR data',
      })
    }

    // No OCR data - mark as extracting and trigger OCR
    await supabaseAdmin
      .from('documents')
      .update({
        status: 'extracting',
        ocr_status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    // Get file URL from storage_path (set during upload)
    const storagePath = doc.storage_path || `${companyId}/${doc.period || 'unsorted'}/${doc.file_name}`
    const { data: signedData } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(storagePath, 600) // 10 min

    if (!signedData?.signedUrl) {
      await supabaseAdmin
        .from('documents')
        .update({ ocr_status: 'error', status: 'uploaded' })
        .eq('id', documentId)
      return NextResponse.json({ error: 'Could not access document file' }, { status: 500 })
    }

    // Call Kimi AI for extraction
    try {
      const { KimiAIClient } = await import('@/lib/kimi-ai')
      const kimi = new KimiAIClient()
      const result = await kimi.extractInvoiceData(signedData.signedUrl, doc.file_name)

      // Store OCR result and populate denormalized fields
      const ocrData = result as unknown as Record<string, unknown>
      await supabaseAdmin
        .from('documents')
        .update({
          ocr_data: ocrData,
          ocr_processed: true,
          ocr_status: 'completed',
          status: 'extracted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      await populateDenormalizedFields(documentId, ocrData)

      return NextResponse.json({
        success: true,
        source: 'kimi_ocr',
        confidence_score: result.confidence_score,
      })
    } catch (ocrErr) {
      console.error('OCR extraction failed:', ocrErr)
      await supabaseAdmin
        .from('documents')
        .update({
          ocr_status: 'error',
          status: 'uploaded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
      return NextResponse.json({ error: 'OCR extraction failed' }, { status: 500 })
    }
  } catch (err) {
    console.error('Extract document error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
