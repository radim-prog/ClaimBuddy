import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceStats } from '@/lib/insurance-store'

export const dynamic = 'force-dynamic'

// GET /api/claims/stats — aggregate stats for dashboard
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const stats = await getInsuranceStats(userRole === 'admin' ? undefined : userId)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[Claims stats] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
