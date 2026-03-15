import { NextRequest, NextResponse } from 'next/server'
import { downgradeExpiredTrials } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

// Cron endpoint: downgrade expired trials to Free
// Should be called daily (e.g., via Vercel cron or external scheduler)
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const downgraded = await downgradeExpiredTrials()
    return NextResponse.json({
      ok: true,
      downgraded,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Trial expiry cron failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
