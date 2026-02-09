import { NextResponse } from 'next/server'
import { extractDocument, ExtractedInvoice } from '@/lib/document-extractor'
import { downloadFile, checkConfiguration } from '@/lib/google-drive'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/documents/extract
 * 
 * Spustí OCR extrakci pro jeden nebo více dokumentů.
 * Body:
 * - fileIds: string[] - Google Drive file IDs
 * - companyId: string - ID firmy
 * - period: string - období (YYYY-MM)
 */
export async function POST(request: Request) {
  try {
    // Kontrola Google Drive konfigurace
    const driveConfig = checkConfiguration()
    if (!driveConfig.valid) {
      return NextResponse.json(
        { error: 'Google Drive not configured', message: driveConfig.message },
        { status: 503 }
      )
    }

    // Kontrola Anthropic API
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'OCR extraction not available',
          message: 'ANTHROPIC_API_KEY not configured. Set the environment variable to enable OCR.'
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { fileIds, companyId, period } = body

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid fileIds array' },
        { status: 400 }
      )
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing companyId' },
        { status: 400 }
      )
    }

    const results: Array<{
      fileId: string
      fileName: string
      status: 'success' | 'error'
      invoice?: ExtractedInvoice
      documentId?: string
      confidence_score?: number
      error?: string
    }> = []

    // Zpracování každého souboru
    for (const fileId of fileIds) {
      try {
        // Stažení souboru
        const buffer = await downloadFile(fileId)

        // Extrakce (3-kolový systém)
        const result = await extractDocument(buffer, `${fileId}.pdf`)
        const invoice = result.final_data

        // Uložení do databáze
        const { data: document, error: dbError } = await supabaseAdmin
          .from('documents')
          .insert({
            company_id: companyId,
            period: period || new Date().toISOString().slice(0, 7),
            type: 'expense_invoice',
            file_name: invoice.document_number || fileId,
            google_drive_file_id: fileId,
            ocr_data: invoice,
            ocr_status: 'extracted',
            ocr_processed: new Date().toISOString(),
            status: 'extracted',
          })
          .select()
          .single()

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`)
        }

        results.push({
          fileId,
          fileName: invoice.document_number || fileId,
          status: 'success',
          invoice,
          documentId: document.id,
        })
      } catch (error) {
        console.error(`Extraction failed for ${fileId}:`, error)
        results.push({
          fileId,
          fileName: fileId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Extraction failed',
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      summary: {
        total: fileIds.length,
        success: successCount,
        errors: errorCount,
      },
      results,
    })
  } catch (error) {
    console.error('Document extract API error:', error)
    return NextResponse.json(
      { 
        error: 'Extraction failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
