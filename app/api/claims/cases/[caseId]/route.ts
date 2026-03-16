import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase, updateInsuranceCase, deleteInsuranceCase, addCaseEvent } from '@/lib/insurance-store'
import { updateCaseSchema, formatZodErrors } from '@/lib/validations'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ caseId: string }> }

// GET /api/claims/cases/[caseId] — detail
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    const caseData = await getInsuranceCase(caseId)
    if (!caseData) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // IDOR: non-admin can only see cases assigned to them
    if (userRole !== 'admin' && caseData.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ case: caseData })
  } catch (error) {
    console.error('[Claims case] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/claims/cases/[caseId] — add note
export async function POST(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const existing = await getInsuranceCase(caseId)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (userRole !== 'admin' && existing.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (body.action !== 'add_note') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    if (!body.note || typeof body.note !== 'string' || body.note.trim().length === 0) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const event = await addCaseEvent({
      case_id: caseId,
      event_type: 'note_added',
      actor: userId,
      description: body.note.trim(),
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('[Claims case] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/claims/cases/[caseId] — update status, fields
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const existing = await getInsuranceCase(caseId)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (userRole !== 'admin' && existing.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateCaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const updated = await updateInsuranceCase(caseId, parsed.data, userId)
    return NextResponse.json({ case: updated })
  } catch (error) {
    console.error('[Claims case] PATCH error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/claims/cases/[caseId] — delete case (only 'new' status)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  try {
    // IDOR check
    const existing = await getInsuranceCase(caseId)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (userRole !== 'admin' && existing.assigned_to !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteInsuranceCase(caseId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Claims case] DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
