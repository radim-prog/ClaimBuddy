import { NextRequest, NextResponse } from 'next/server'
import { getFileById, cacheFileToStorage } from '@/lib/drive-sync-store'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - Download file content (binary response)
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fileId } = params
    let file = await getFileById(fileId)

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // If not cached in storage but has a Drive ID, cache it first
    if (!file.storage_path && file.google_drive_id) {
      await cacheFileToStorage(fileId)
      // Re-fetch to get updated storage_path
      file = await getFileById(fileId)
      if (!file) {
        return NextResponse.json({ error: 'File not found after caching' }, { status: 404 })
      }
    }

    if (!file.storage_path) {
      return NextResponse.json({ error: 'File not available in storage' }, { status: 404 })
    }

    // Download blob from Supabase Storage
    const { data: blob, error } = await supabaseAdmin.storage
      .from('drive-cache')
      .download(file.storage_path)

    if (error || !blob) {
      console.error('Storage download error:', error)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    // Determine Content-Disposition (inline for PDFs/images, attachment otherwise)
    const mimeType = file.mime_type || 'application/octet-stream'
    const inlineTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']
    const inline = request.nextUrl.searchParams.get('inline') === 'true'
      && inlineTypes.includes(mimeType)

    const disposition = inline
      ? `inline; filename="${encodeURIComponent(file.name)}"`
      : `attachment; filename="${encodeURIComponent(file.name)}"`

    return new Response(blob, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': disposition,
        'Content-Length': String(blob.size),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('File download error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
