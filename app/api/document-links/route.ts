import { NextRequest, NextResponse } from 'next/server'
import { createDocumentLink, deleteDocumentLink } from '@/lib/document-link-store'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name') || 'Účetní'
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { entity_type, entity_id, document_id, link_type } = body

    if (!entity_type || !entity_id || !document_id) {
      return NextResponse.json({ error: 'entity_type, entity_id, document_id are required' }, { status: 400 })
    }

    const link = await createDocumentLink(
      { document_id, entity_type, entity_id, link_type: link_type || 'reference' },
      userId,
      userName
    )

    return NextResponse.json(link, { status: 201 })
  } catch (err) {
    console.error('Create document link error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
