import { NextRequest, NextResponse } from 'next/server'
import { addComment, getComments, updateComment, softDeleteComment } from '@/lib/document-link-store'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const comments = await getComments(params.documentId, true)
    return NextResponse.json(comments)
  } catch (err) {
    console.error('Get comments error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name') || 'Účetní'
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content, is_internal } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const comment = await addComment(
      { document_id: params.documentId, content: content.trim(), is_internal },
      userId,
      userName,
      'accountant'
    )

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('Add comment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string; documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { comment_id, content, is_internal } = body

    if (!comment_id) {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 })
    }

    const comment = await updateComment(comment_id, { content, is_internal }, userId)
    return NextResponse.json(comment)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message.includes('Not authorized') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string; documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('comment_id')

    if (!commentId) {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 })
    }

    await softDeleteComment(commentId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message.includes('Not authorized') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
