import { NextRequest, NextResponse } from 'next/server'
import { clientHasAccountant } from '@/lib/subscription-store'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hasAccountant = await clientHasAccountant(userId)
  return NextResponse.json({ hasAccountant })
}
