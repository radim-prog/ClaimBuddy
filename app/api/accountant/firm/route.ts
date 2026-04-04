import { NextRequest, NextResponse } from 'next/server'
import { getFirmById, getFirmUsers, getFirmCompanies, updateFirm } from '@/lib/tenant-store'
import { getFirmId } from '@/lib/firm-scope'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

const PLAN_CLIENT_LIMITS: Record<string, number> = {
  free: 5,
  starter: 20,
  professional: 100,
  enterprise: Infinity,
}

const PLAN_USER_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  professional: 10,
  enterprise: Infinity,
}

const PLAN_EXTRACTION_LIMITS: Record<string, number> = {
  free: 0,
  starter: 10,
  professional: 50,
  enterprise: 200,
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)
  if (!firmId) return NextResponse.json({ error: 'No firm assigned' }, { status: 404 })

  try {
    const [firm, users, companies] = await Promise.all([
      getFirmById(firmId),
      getFirmUsers(firmId),
      getFirmCompanies(firmId),
    ])

    if (!firm) return NextResponse.json({ error: 'Firm not found' }, { status: 404 })

    const planTier = firm.plan_tier || 'free'

    return NextResponse.json({
      firm,
      stats: {
        client_count: companies.length,
        team_count: users.length,
      },
      limits: {
        users: { current: users.length, limit: PLAN_USER_LIMITS[planTier] ?? 1 },
        clients: { current: companies.length, limit: PLAN_CLIENT_LIMITS[planTier] ?? 5 },
        extractions: { current: 0, limit: PLAN_EXTRACTION_LIMITS[planTier] ?? 0 },
      },
    })
  } catch (error) {
    console.error('[Firm API] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const firmId = getFirmId(request)
  if (!firmId) return NextResponse.json({ error: 'No firm assigned' }, { status: 404 })

  try {
    const body = await request.json()

    // Only allow safe fields to be updated
    const allowedFields = ['name', 'ico', 'dic', 'email', 'phone', 'website', 'address', 'billing_email', 'settings']
    const sanitized: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) sanitized[key] = body[key]
    }

    const firm = await updateFirm(firmId, sanitized)
    if (!firm) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    return NextResponse.json({ firm })
  } catch (error) {
    console.error('[Firm API] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
