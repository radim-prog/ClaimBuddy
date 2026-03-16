import { NextRequest, NextResponse } from 'next/server'
import { updateCompany, getCompanyById } from '@/lib/company-store'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['active', 'inactive', 'onboarding', 'pending_review'] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { companyId } = params
    const body = await request.json()
    const { status } = body as { status: string }

    if (!status || !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const company = await getCompanyById(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const updated = await updateCompany(companyId, { status } as any)

    return NextResponse.json({ company: updated })
  } catch (error) {
    console.error('Company status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
