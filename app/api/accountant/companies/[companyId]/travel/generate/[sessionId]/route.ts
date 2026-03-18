import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import {
  getFullSession,
  updateSession,
  deleteSession,
} from '@/lib/travel-generation-store'
import { getFirmId, verifyCompanyAccess } from '@/lib/firm-scope'

export const dynamic = 'force-dynamic'

// GET: Full session with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; sessionId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const data = await getFullSession(params.sessionId)
    if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (data.session.company_id !== params.companyId) {
      return NextResponse.json({ error: 'Session does not belong to this company' }, { status: 403 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get generation session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update session fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string; sessionId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmIdPatch = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmIdPatch)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const allowedFields = [
      'status', 'input_snapshot', 'ai_model', 'distance_source',
      'total_trips', 'total_km', 'total_reimbursement',
      'credits_consumed', 'validation_score', 'validation_issues',
      'generated_at', 'exported_at',
    ]

    const updates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const session = await updateSession(params.sessionId, updates as any)
    return NextResponse.json({ session })
  } catch (error) {
    console.error('Update generation session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete session (cascade deletes fuel_data, odometer, etc.)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string; sessionId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmIdDel = getFirmId(request)
  if (!await verifyCompanyAccess(params.companyId, firmIdDel)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await deleteSession(params.sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete generation session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
