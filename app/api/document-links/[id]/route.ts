import { NextRequest, NextResponse } from 'next/server'
import { deleteDocumentLink } from '@/lib/document-link-store'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'accountant' && userRole !== 'admin' && userRole !== 'assistant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await deleteDocumentLink(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete document link error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
