import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET /api/accountant/bookmarks — list user bookmarks
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ bookmarks: data ?? [] })
  } catch (error) {
    console.error('Bookmarks GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/accountant/bookmarks — add a bookmark
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { label, url, icon } = body

    if (!label?.trim() || !url?.trim()) {
      return NextResponse.json({ error: 'Název a URL jsou povinné' }, { status: 400 })
    }

    // Get next position
    const { data: existing } = await supabaseAdmin
      .from('user_bookmarks')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

    const { data, error } = await supabaseAdmin
      .from('user_bookmarks')
      .insert({
        user_id: userId,
        label: label.trim(),
        url: url.trim(),
        icon: icon?.trim() || null,
        position: nextPosition,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ bookmark: data }, { status: 201 })
  } catch (error) {
    console.error('Bookmarks POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/accountant/bookmarks — delete a bookmark
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing bookmark id' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('user_bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bookmarks DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/accountant/bookmarks — rename or reorder
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, label, position } = body

    if (!id) return NextResponse.json({ error: 'Missing bookmark id' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (label !== undefined) updates.label = label.trim()
    if (position !== undefined) updates.position = position

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_bookmarks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ bookmark: data })
  } catch (error) {
    console.error('Bookmarks PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
