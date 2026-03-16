import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase, getCaseDocuments, deleteCaseDocument, addCaseEvent } from '@/lib/insurance-store'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string; docId: string }> }

// GET /api/claims/cases/[caseId]/documents/[docId] — download (redirect to file URL)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId, docId } = await params

  try {
    // IDOR check
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find the document in this case
    const documents = await getCaseDocuments(caseId)
    const doc = documents.find(d => d.id === docId)
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Redirect to the stored file URL
    return NextResponse.redirect(doc.file_path)
  } catch (error) {
    console.error('[Claims document] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/claims/cases/[caseId]/documents/[docId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId, docId } = await params

  try {
    // IDOR check
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify document belongs to this case
    const documents = await getCaseDocuments(caseId)
    const doc = documents.find(d => d.id === docId)
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await deleteCaseDocument(docId)

    // Log deletion event
    try {
      await addCaseEvent({
        case_id: caseId,
        event_type: 'document_removed',
        actor: userId,
        description: `Dokument smazán: ${doc.name}`,
        metadata: { document_id: docId },
      })
    } catch (evtErr) {
      console.error(`[Claims document] Failed to log delete event:`, evtErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Claims document] DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
