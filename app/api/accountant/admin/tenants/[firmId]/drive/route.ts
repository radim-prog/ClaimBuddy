export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { saveFirmDriveCredentials, disconnectFirmDrive, testFirmDriveConnection } from '@/lib/google-drive-firm'

/**
 * GET /api/accountant/admin/tenants/[firmId]/drive
 * Test Drive connection for a firm
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { firmId } = await params
  const result = await testFirmDriveConnection(firmId)
  return NextResponse.json(result)
}

/**
 * PUT /api/accountant/admin/tenants/[firmId]/drive
 * Save Drive credentials for a firm
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { firmId } = await params
  const body = await request.json()
  const { client_id, client_secret, refresh_token, root_folder_id } = body

  if (!client_id || !client_secret || !refresh_token) {
    return NextResponse.json({ error: 'client_id, client_secret and refresh_token are required' }, { status: 400 })
  }

  const saved = await saveFirmDriveCredentials(firmId, {
    client_id, client_secret, refresh_token, root_folder_id,
  }, userId)

  if (!saved) {
    return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
  }

  // Test the connection
  const test = await testFirmDriveConnection(firmId)
  return NextResponse.json({ success: true, ...test })
}

/**
 * DELETE /api/accountant/admin/tenants/[firmId]/drive
 * Disconnect Drive for a firm
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { firmId } = await params
  const result = await disconnectFirmDrive(firmId)

  if (!result) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
