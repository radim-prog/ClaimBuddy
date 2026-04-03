import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify cron job authorization.
 * Fail-closed: rejects if CRON_SECRET is not configured (500)
 * or if the Bearer token doesn't match (401).
 *
 * @returns null if authorized, NextResponse if rejected
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[Cron Auth] CRON_SECRET is not configured — rejecting request')
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return null
}
