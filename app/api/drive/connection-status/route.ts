import { NextRequest, NextResponse } from 'next/server'
import { testFirmDriveConnection } from '@/lib/google-drive-firm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/drive/connection-status?firmId=xxx
 * Returns the Drive connection status for a firm.
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = request.nextUrl.searchParams.get('firmId')
  if (!firmId) {
    return NextResponse.json({ error: 'firmId is required' }, { status: 400 })
  }

  try {
    const result = await testFirmDriveConnection(firmId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Drive] Connection status error:', error)
    return NextResponse.json({ connected: false, error: 'Check failed' })
  }
}
