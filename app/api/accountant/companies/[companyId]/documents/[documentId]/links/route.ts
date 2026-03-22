import { NextRequest, NextResponse } from 'next/server'
import { createDocumentLink, deleteDocumentLink, getLinksForDocument } from '@/lib/document-link-store'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'
import { getUserName } from '@/lib/request-utils'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const links = await getLinksForDocument(params.documentId)
    return NextResponse.json(links)
  } catch (err) {
    console.error('Get document links error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; documentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userName = getUserName(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { entity_type, entity_id, link_type, note } = body

    if (!entity_type || !entity_id) {
      return NextResponse.json({ error: 'entity_type and entity_id are required' }, { status: 400 })
    }

    const link = await createDocumentLink(
      { document_id: params.documentId, entity_type, entity_id, link_type, note },
      userId,
      userName
    )

    return NextResponse.json(link, { status: 201 })
  } catch (err) {
    console.error('Create document link error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('link_id')

    if (!linkId) {
      return NextResponse.json({ error: 'link_id is required' }, { status: 400 })
    }

    await deleteDocumentLink(linkId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete document link error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
