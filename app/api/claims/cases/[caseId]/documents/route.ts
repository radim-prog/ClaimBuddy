import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase, getCaseDocuments, addCaseDocument } from '@/lib/insurance-store'
import { addCaseDocumentSchema, formatZodErrors } from '@/lib/validations'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string }> }

// GET /api/claims/cases/[caseId]/documents
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const documents = await getCaseDocuments(caseId)
    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[Claims documents] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/cases/[caseId]/documents
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = addCaseDocumentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const doc = await addCaseDocument({
      case_id: caseId,
      name: parsed.data.name,
      file_path: parsed.data.file_path,
      file_size: parsed.data.file_size,
      mime_type: parsed.data.mime_type,
      document_type: parsed.data.document_type,
      uploaded_by: userId,
      note: parsed.data.note ?? undefined,
    })

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    console.error('[Claims documents] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
