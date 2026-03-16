import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase, getCaseEvents, addCaseEvent } from '@/lib/insurance-store'
import { addCaseEventSchema, formatZodErrors } from '@/lib/validations'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string }> }

// GET /api/claims/cases/[caseId]/events — timeline
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

    const events = await getCaseEvents(caseId)
    return NextResponse.json({ events })
  } catch (error) {
    console.error('[Claims events] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/cases/[caseId]/events — add timeline event
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
    const parsed = addCaseEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const event = await addCaseEvent({
      case_id: caseId,
      event_type: parsed.data.event_type,
      actor: userId,
      description: parsed.data.description,
      metadata: parsed.data.metadata,
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('[Claims events] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
