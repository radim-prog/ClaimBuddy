import { NextRequest, NextResponse } from 'next/server'
import { mapCompanyToDrive, unmapCompanyDrive, getCompanyDriveMappings } from '@/lib/drive-sync-store'
import * as gdrive from '@/lib/google-drive'

export const dynamic = 'force-dynamic'

// GET - List all companies with their Drive mapping status
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const mappings = await getCompanyDriveMappings()

    return NextResponse.json({ mappings })
  } catch (error) {
    console.error('Drive map-company GET error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST - Map a company to a Google Drive folder
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, driveFolderId } = body as { companyId?: string; driveFolderId?: string }

    if (!companyId || !driveFolderId) {
      return NextResponse.json(
        { error: 'companyId and driveFolderId are required' },
        { status: 400 }
      )
    }

    // Validate that the Drive folder exists and is accessible
    try {
      await gdrive.listFolder(driveFolderId)
    } catch {
      return NextResponse.json(
        { error: 'Drive folder not found or not accessible' },
        { status: 404 }
      )
    }

    await mapCompanyToDrive(companyId, driveFolderId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Drive map-company POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Disconnect a company from Google Drive
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId } = body as { companyId?: string }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    await unmapCompanyDrive(companyId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Drive map-company DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
