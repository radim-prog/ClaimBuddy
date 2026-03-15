import { NextRequest, NextResponse } from 'next/server'
import { getTrialStatus, startReverseTrial } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

function getPortalType(request: NextRequest): 'accountant' | 'client' {
  return request.headers.get('x-user-role') === 'client' ? 'client' : 'accountant'
}

// GET: Check trial status and countdown
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.MONETIZATION_ENABLED !== 'true') {
    return NextResponse.json({ trial: null, monetization_enabled: false })
  }

  const trial = await getTrialStatus(userId, getPortalType(request))

  return NextResponse.json({ trial, monetization_enabled: true })
}

// POST: Start reverse trial (30 days Profi)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.MONETIZATION_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Monetization is not enabled' }, { status: 400 })
  }

  const portalType = getPortalType(request)

  // Check if user already has/had a trial
  const existing = await getTrialStatus(userId, portalType)
  if (existing) {
    return NextResponse.json({ error: 'Trial already active', trial: existing }, { status: 400 })
  }

  const subscription = await startReverseTrial(userId, portalType)
  const trial = await getTrialStatus(userId, portalType)

  return NextResponse.json({ subscription, trial })
}
