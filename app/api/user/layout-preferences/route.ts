import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const pageKey = searchParams.get('page_key')

    if (!pageKey) {
      return NextResponse.json({ error: 'page_key is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_layout_preferences')
      .select('layout')
      .eq('user_id', userId)
      .eq('page_key', pageKey)
      .maybeSingle()

    if (error) {
      console.error('Error fetching layout preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ layout: data?.layout || null })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { page_key, layout } = body

    if (!page_key || !layout) {
      return NextResponse.json({ error: 'page_key and layout are required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('user_layout_preferences')
      .upsert(
        {
          user_id: userId,
          page_key,
          layout,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,page_key' }
      )

    if (error) {
      console.error('Error saving layout preferences:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
