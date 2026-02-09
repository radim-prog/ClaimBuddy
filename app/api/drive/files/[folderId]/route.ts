import { NextResponse } from 'next/server'
import { listFiles, checkConfiguration, DOCUMENT_MIME_TYPES } from '@/lib/google-drive'

export const dynamic = 'force-dynamic'

/**
 * GET /api/drive/files/[folderId]
 * 
 * Vrátí seznam souborů v dané složce.
 * Výchozí filtr: PDF a obrázky.
 */
export async function GET(
  request: Request,
  { params }: { params: { folderId: string } }
) {
  try {
    // Kontrola konfigurace
    const config = checkConfiguration()
    if (!config.valid) {
      return NextResponse.json(
        { error: 'Google Drive not configured', message: config.message },
        { status: 503 }
      )
    }

    const { folderId } = params

    if (!folderId) {
      return NextResponse.json(
        { error: 'Missing folderId parameter' },
        { status: 400 }
      )
    }

    // Výchozí filtr: PDF a obrázky
    const mimeTypes = [
      DOCUMENT_MIME_TYPES.PDF,
      DOCUMENT_MIME_TYPES.IMAGE_PNG,
      DOCUMENT_MIME_TYPES.IMAGE_JPEG,
      DOCUMENT_MIME_TYPES.IMAGE_JPG,
      DOCUMENT_MIME_TYPES.IMAGE_WEBP,
    ]

    const files = await listFiles(folderId, mimeTypes)

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
      folderId,
    })
  } catch (error) {
    console.error('Drive files API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list files',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
