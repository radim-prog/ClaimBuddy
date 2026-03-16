import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase, getCaseDocuments } from '@/lib/insurance-store'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string; docId: string }> }

// GET /api/claims/cases/[caseId]/documents/[docId]/download
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
    console.error('[Claims document download] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
