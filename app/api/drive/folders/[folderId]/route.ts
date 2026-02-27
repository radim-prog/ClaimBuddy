import { NextRequest, NextResponse } from 'next/server'
import { getFolderFiles, updateFolder, deleteFolder } from '@/lib/drive-sync-store'
import type { FileSortField } from '@/lib/types/drive'

export const dynamic = 'force-dynamic'

type RouteParams = { params: { folderId: string } }

// GET - Get folder contents (files) with filters
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { folderId } = params
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('perPage') || '50', 10)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const projectId = searchParams.get('projectId')
    const includeProjectFiles = searchParams.get('includeProjectFiles') === 'true'
    const search = searchParams.get('search') || undefined
    const sortField = (searchParams.get('sortField') || 'created_at') as FileSortField
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    const result = await getFolderFiles(folderId, {
      page,
      perPage,
      period: {
        year: year ? parseInt(year, 10) : null,
        month: month ? parseInt(month, 10) : null,
      },
      projectId: projectId || null,
      includeProjectFiles,
      search,
      sort: { field: sortField, dir: sortDir },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Drive folder files GET error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PATCH - Update folder (name, icon, client_visible, sort_order)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { folderId } = params
    const body = await request.json()

    // Only allow specific fields to be updated
    const allowedFields = ['name', 'icon', 'client_visible', 'sort_order'] as const
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const folder = await updateFolder(folderId, updates as Parameters<typeof updateFolder>[1])

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Drive folder PATCH error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE - Delete custom folder (system folders cannot be deleted)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { folderId } = params

    await deleteFolder(folderId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Drive folder DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Cannot delete system folder') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
