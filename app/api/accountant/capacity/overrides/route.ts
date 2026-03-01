import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('user_id')

    let query = supabaseAdmin
      .from('user_capacity_overrides')
      .select('*')
      .order('date_from', { ascending: false })

    // Non-admin can only see own overrides
    if (userRole !== 'admin' && userRole !== 'accountant') {
      query = query.eq('user_id', userId)
    } else if (targetUserId) {
      query = query.eq('user_id', targetUserId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 })
    }

    return NextResponse.json({ overrides: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { user_id, date_from, date_to, daily_hours, reason } = body

    if (!user_id || !date_from || !date_to) {
      return NextResponse.json({ error: 'user_id, date_from, date_to required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_capacity_overrides')
      .insert({
        user_id,
        date_from,
        date_to,
        daily_hours: daily_hours ?? 0,
        reason: reason || null,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create override' }, { status: 500 })
    }

    return NextResponse.json({ override: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const overrideId = searchParams.get('id')
    if (!overrideId) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('user_capacity_overrides')
      .delete()
      .eq('id', overrideId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete override' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
