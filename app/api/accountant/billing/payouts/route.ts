import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { getPayouts } from '@/lib/billing-service'

export const dynamic = 'force-dynamic'

// GET: Payout history for the current accountant
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || !isStaffRole(userRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const payouts = await getPayouts(userId)
    return NextResponse.json({ payouts })
  } catch (error) {
    console.error('[Billing payouts] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
