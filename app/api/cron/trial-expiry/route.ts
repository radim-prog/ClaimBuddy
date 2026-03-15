import { NextRequest, NextResponse } from 'next/server'
import { downgradeExpiredTrials } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

// Cron endpoint: downgrade expired trials to Free
// Should be called daily (e.g., via Vercel cron or external scheduler)
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const downgraded = await downgradeExpiredTrials()

  return NextResponse.json({
    ok: true,
    downgraded,
    timestamp: new Date().toISOString(),
  })
}
