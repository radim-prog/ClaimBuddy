import { NextRequest, NextResponse } from 'next/server'
import { uploadNewFile } from '@/lib/drive-sync-store'

export const dynamic = 'force-dynamic'

// POST - Upload a file to a company folder
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string | null
    const folderId = formData.get('folderId') as string | null

    if (!file || !companyId || !folderId) {
      return NextResponse.json(
        { error: 'file, companyId, and folderId are required' },
        { status: 400 }
      )
    }

    // Optional metadata fields
    const fiscalYearRaw = formData.get('fiscalYear') as string | null
    const periodMonthRaw = formData.get('periodMonth') as string | null
    const projectId = formData.get('projectId') as string | null
    const clientVisibleRaw = formData.get('clientVisible') as string | null

    const fiscalYear = fiscalYearRaw ? parseInt(fiscalYearRaw, 10) : undefined
    const periodMonth = periodMonthRaw ? parseInt(periodMonthRaw, 10) : undefined
    const clientVisible = clientVisibleRaw !== null
      ? clientVisibleRaw === 'true'
      : undefined

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const driveFile = await uploadNewFile(
      companyId,
      folderId,
      file.name,
      buffer,
      file.type || 'application/octet-stream',
      {
        fiscalYear,
        periodMonth,
        projectId: projectId || undefined,
        clientVisible,
      }
    )

    return NextResponse.json({ file: driveFile }, { status: 201 })
  } catch (error) {
    console.error('File upload error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
