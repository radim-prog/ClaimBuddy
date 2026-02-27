import { NextRequest, NextResponse } from 'next/server'
import { initCompanyFolders } from '@/lib/drive-sync-store'

export const dynamic = 'force-dynamic'

const VALID_ENTITY_TYPES = ['osvc', 'sro', 'as'] as const

// POST - Initialize template folders for a company
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, entityType } = body

    if (!companyId || !entityType) {
      return NextResponse.json(
        { error: 'companyId and entityType are required' },
        { status: 400 }
      )
    }

    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json(
        { error: `entityType must be one of: ${VALID_ENTITY_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const folders = await initCompanyFolders(companyId, entityType)

    return NextResponse.json({
      folders,
      created: folders.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Drive folders init POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
