import { NextRequest, NextResponse } from 'next/server'
import {
  syncCompanyFull,
  syncCompanyIncremental,
  getSyncState,
} from '@/lib/drive-sync-store'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

// GET - Get sync state for a company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    const syncState = await getSyncState(companyId)

    return NextResponse.json({ syncState })
  } catch (error) {
    console.error('Drive sync GET error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST - Trigger manual sync for a company
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { companyId, mode } = body as { companyId?: string; mode?: 'full' | 'incremental' }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    const syncMode = mode || 'incremental'

    const result =
      syncMode === 'full'
        ? await syncCompanyFull(companyId)
        : await syncCompanyIncremental(companyId)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Drive sync POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
