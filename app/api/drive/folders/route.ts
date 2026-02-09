import { NextResponse } from 'next/server'
import { listFolders, checkConfiguration } from '@/lib/google-drive'

export const dynamic = 'force-dynamic'

/**
 * GET /api/drive/folders
 * 
 * Vrátí seznam Google Drive složek.
 * Query params:
 * - parentId: ID rodičovské složky (optional, default 'root')
 */
export async function GET(request: Request) {
  try {
    // Kontrola konfigurace
    const config = checkConfiguration()
    if (!config.valid) {
      return NextResponse.json(
        { error: 'Google Drive not configured', message: config.message },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId') || undefined

    const folders = await listFolders(parentId)

    return NextResponse.json({
      success: true,
      folders,
      count: folders.length,
    })
  } catch (error) {
    console.error('Drive folders API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list folders',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
