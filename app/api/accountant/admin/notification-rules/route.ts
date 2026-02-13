import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - list notification rules
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('notification_rules')
      .select('*')
      .order('event_code')

    if (error) {
      console.error('Error fetching notification rules:', error)
      return NextResponse.json({ error: 'Failed to fetch notification rules' }, { status: 500 })
    }

    return NextResponse.json({ rules: data || [] })
  } catch (error) {
    console.error('Notification rules API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create notification rule
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { event_id, event_code, recipients, channels, is_active } = body

    if (!event_code) {
      return NextResponse.json({ error: 'event_code is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('notification_rules')
      .insert({
        event_id: event_id || null,
        event_code,
        recipients: recipients || [],
        channels: channels || ['in_app'],
        is_active: is_active !== false,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification rule:', error)
      return NextResponse.json({ error: 'Failed to create notification rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule: data }, { status: 201 })
  } catch (error) {
    console.error('Notification rules POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - update notification rule
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('notification_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification rule:', error)
      return NextResponse.json({ error: 'Failed to update notification rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule: data })
  } catch (error) {
    console.error('Notification rules PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - delete notification rule
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('id')

    if (!ruleId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('notification_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      console.error('Error deleting notification rule:', error)
      return NextResponse.json({ error: 'Failed to delete notification rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification rules DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
