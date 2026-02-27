import { NextRequest, NextResponse } from 'next/server'
import { addComment, getComments } from '@/lib/document-link-store'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Client can only see non-internal comments
    const comments = await getComments(params.documentId, false)
    return NextResponse.json(comments)
  } catch (err) {
    console.error('Get client comments error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name') || 'Klient'
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Client comments are always non-internal
    const comment = await addComment(
      { document_id: params.documentId, content: content.trim(), is_internal: false },
      userId,
      userName,
      'client'
    )

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('Add client comment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
