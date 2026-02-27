import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { documentId } = params

  // Fetch document metadata
  const { data: doc, error } = await supabaseAdmin
    .from('documents')
    .select('id, company_id, file_name, storage_path, mime_type')
    .eq('id', documentId)
    .is('deleted_at', null)
    .single()

  if (error || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  if (!doc.storage_path) {
    return NextResponse.json({ error: 'File not available in storage' }, { status: 404 })
  }

  // Generate signed URL (1 hour)
  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from('documents')
    .createSignedUrl(doc.storage_path, 3600)

  if (signError || !signedData?.signedUrl) {
    console.error('Signed URL error:', signError)
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  // Check if inline preview requested
  const inline = request.nextUrl.searchParams.get('inline') === 'true'

  if (inline) {
    // Redirect to signed URL for inline viewing (PDF in browser)
    return NextResponse.redirect(signedData.signedUrl)
  }

  // Return download URL (client handles download)
  return NextResponse.json({
    url: signedData.signedUrl,
    file_name: doc.file_name,
    mime_type: doc.mime_type,
  })
}
