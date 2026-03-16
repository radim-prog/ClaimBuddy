import { NextRequest, NextResponse } from 'next/server'
import { updateMarketingConsent } from '@/lib/marketing-service'

export const dynamic = 'force-dynamic'

// PATCH: Update marketing consent for a user (admin can change any, client can change own)
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { targetUserId, consent } = body as { targetUserId?: string; consent: boolean }

  // Admin can change any user, client only own
  const effectiveUserId = (userRole === 'admin' && targetUserId) ? targetUserId : userId

  if (typeof consent !== 'boolean') {
    return NextResponse.json({ error: 'consent must be boolean' }, { status: 400 })
  }

  try {
    await updateMarketingConsent(effectiveUserId, consent)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Marketing consent] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
