import { NextRequest, NextResponse } from 'next/server'
import { getGraphLayout, saveGraphLayout } from '@/lib/company-graph-store'

export const dynamic = 'force-dynamic'

/**
 * GET /api/accountant/companies/layout
 * Returns user's graph layout (positions, bubbles, zoom state)
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const layoutType = request.nextUrl.searchParams.get('type') || 'galaxy'
    const layout = await getGraphLayout(userId, layoutType)
    return NextResponse.json({ layout })
  } catch (error) {
    console.error('[layout/GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/accountant/companies/layout
 * Save/update user's graph layout (debounced from client)
 */
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { layout_type, positions, bubbles, zoom_state } = body

    if (!positions || typeof positions !== 'object') {
      return NextResponse.json({ error: 'positions object is required' }, { status: 400 })
    }

    const layout = await saveGraphLayout(
      userId,
      layout_type || 'galaxy',
      positions,
      bubbles,
      zoom_state,
    )

    return NextResponse.json({ layout })
  } catch (error) {
    console.error('[layout/PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
