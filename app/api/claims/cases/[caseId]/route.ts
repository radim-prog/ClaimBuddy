import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCase, updateInsuranceCase } from '@/lib/insurance-store'
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
