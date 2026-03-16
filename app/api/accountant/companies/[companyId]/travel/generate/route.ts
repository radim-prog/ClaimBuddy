import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { createSession, getSessionsByCompany } from '@/lib/travel-generation-store'

export const dynamic = 'force-dynamic'

// POST: Create new generation session
export async function POST(
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
    const { period_start, period_end } = body as { period_start: string; period_end: string }

    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'period_start and period_end required' }, { status: 400 })
    }

    // Validate format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(period_start) || !/^\d{4}-\d{2}$/.test(period_end)) {
      return NextResponse.json({ error: 'Invalid period format (YYYY-MM)' }, { status: 400 })
    }

    if (period_start > period_end) {
      return NextResponse.json({ error: 'period_start must be <= period_end' }, { status: 400 })
    }

    // Rate limit: max 5 sessions/day per company
    const existing = await getSessionsByCompany(companyId)
    const today = new Date().toISOString().split('T')[0]
    const todaySessions = existing.filter(s => s.created_at.startsWith(today))
    if (todaySessions.length >= 5) {
      return NextResponse.json({ error: 'Max 5 sessions per day' }, { status: 429 })
    }

    const session = await createSession(companyId, userId, period_start, period_end)

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Create generation session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: List sessions for company
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const sessions = await getSessionsByCompany(params.companyId)
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('List generation sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
