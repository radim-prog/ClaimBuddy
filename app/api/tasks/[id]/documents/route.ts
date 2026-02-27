import { NextRequest, NextResponse } from 'next/server'
import { getLinksForEntity, bulkCreateLinks, deleteDocumentLink } from '@/lib/document-link-store'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const links = await getLinksForEntity('task', params.id)
    return NextResponse.json(links)
  } catch (err) {
    console.error('Get task documents error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name') || 'Účetní'
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { document_ids, link_type } = body

    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json({ error: 'document_ids array is required' }, { status: 400 })
    }
    if (document_ids.length > 50) {
      return NextResponse.json({ error: 'Max 50 documents at once' }, { status: 400 })
    }

    const links = await bulkCreateLinks(
      document_ids,
      'task',
      params.id,
      link_type || 'reference',
      userId,
      userName
    )

    return NextResponse.json(links, { status: 201 })
  } catch (err) {
    console.error('Link task documents error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')

    if (!documentId) {
      return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
    }

    // Find the link by document_id + entity
    const { data: link } = await supabaseAdmin
      .from('document_links')
      .select('id')
      .eq('document_id', documentId)
      .eq('entity_type', 'task')
      .eq('entity_id', params.id)
      .single()

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    await deleteDocumentLink(link.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unlink task document error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
