import { NextRequest, NextResponse } from 'next/server'
import { getRaynetCompanies, CATEGORY_KLIENT } from '@/lib/raynet'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const search = request.nextUrl.searchParams.get('search') || undefined
    const category = request.nextUrl.searchParams.get('category')
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')

    const result = await getRaynetCompanies({
      search,
      category: category ? parseInt(category) : CATEGORY_KLIENT,
      offset,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Raynet companies GET error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
