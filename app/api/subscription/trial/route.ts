import { NextRequest, NextResponse } from 'next/server'
import { getTrialStatus, startReverseTrial } from '@/lib/subscription-store'

export const dynamic = 'force-dynamic'

// GET: Check trial status and countdown
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const monetizationEnabled = process.env.MONETIZATION_ENABLED === 'true'
  if (!monetizationEnabled) {
    return NextResponse.json({ trial: null, monetization_enabled: false })
  }

  const portalType = request.headers.get('x-user-role') === 'client' ? 'client' : 'accountant'
  const trial = await getTrialStatus(userId, portalType as 'accountant' | 'client')

  return NextResponse.json({ trial, monetization_enabled: true })
}

// POST: Start reverse trial (30 days Professional)
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const monetizationEnabled = process.env.MONETIZATION_ENABLED === 'true'
  if (!monetizationEnabled) {
    return NextResponse.json({ error: 'Monetization is not enabled' }, { status: 400 })
  }

  const portalType = request.headers.get('x-user-role') === 'client' ? 'client' : 'accountant'

  // Check if user already has/had a trial
  const existing = await getTrialStatus(userId, portalType as 'accountant' | 'client')
  if (existing) {
    return NextResponse.json({ error: 'Trial already active', trial: existing }, { status: 400 })
  }

  const subscription = await startReverseTrial(userId, portalType as 'accountant' | 'client')
  const trial = await getTrialStatus(userId, portalType as 'accountant' | 'client')

  return NextResponse.json({ subscription, trial })
}
