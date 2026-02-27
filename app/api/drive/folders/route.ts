import { NextRequest, NextResponse } from 'next/server'
import { getFolderTree, createFolder } from '@/lib/drive-sync-store'

export const dynamic = 'force-dynamic'

// GET - Get folder tree for a company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    const folders = await getFolderTree(companyId)

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Drive folders GET error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST - Create a new custom folder
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { companyId, name, parentId, icon, clientVisible, hasPeriodFilter } = body

    if (!companyId || !name) {
      return NextResponse.json(
        { error: 'companyId and name are required' },
        { status: 400 }
      )
    }

    const folder = await createFolder(companyId, name, parentId || undefined, {
      icon: icon || undefined,
      clientVisible: clientVisible ?? undefined,
      hasPeriodFilter: hasPeriodFilter ?? undefined,
    })

    return NextResponse.json({ folder }, { status: 201 })
  } catch (error) {
    console.error('Drive folders POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
