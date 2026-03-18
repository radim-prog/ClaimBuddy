import { NextRequest, NextResponse } from 'next/server'
import { bulkUpdateStatus } from '@/lib/document-store'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
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
    const body = await request.json()
    const { document_ids, action, rejection_reason } = body

    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json({ error: 'document_ids must be a non-empty array' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    if (document_ids.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 documents per batch' }, { status: 400 })
    }

    const { companyId } = params
    const status = action === 'approve' ? 'approved' : 'rejected'
    const updated = await bulkUpdateStatus(
      document_ids,
      status as 'approved' | 'rejected',
      userId,
      companyId,
      rejection_reason
    )

    return NextResponse.json({ success: true, updated_count: updated })
  } catch (err) {
    console.error('Bulk update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
