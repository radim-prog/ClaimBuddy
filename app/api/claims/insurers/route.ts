import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getInsuranceCompanies } from '@/lib/insurance-store'

export const dynamic = 'force-dynamic'

// GET /api/claims/insurers — authenticated, returns full insurance company data
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const companies = await getInsuranceCompanies(false) // include inactive
    return NextResponse.json({ companies })
  } catch (error) {
    console.error('[Claims insurers] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
