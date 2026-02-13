import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - list substitution rules
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('substitution_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching substitution rules:', error)
      return NextResponse.json({ error: 'Failed to fetch substitution rules' }, { status: 500 })
    }

    return NextResponse.json({ rules: data || [] })
  } catch (error) {
    console.error('Substitution rules API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create substitution rule
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { user_id, substitute_id, type, start_date, end_date } = body

    if (!user_id || !substitute_id) {
      return NextResponse.json({ error: 'user_id and substitute_id are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('substitution_rules')
      .insert({
        user_id,
        substitute_id,
        type: type || 'permanent',
        start_date: start_date || null,
        end_date: end_date || null,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating substitution rule:', error)
      return NextResponse.json({ error: 'Failed to create substitution rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true, rule: data }, { status: 201 })
  } catch (error) {
    console.error('Substitution rules POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - delete substitution rule
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userRole || !['admin', 'accountant'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('id')

    if (!ruleId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('substitution_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      console.error('Error deleting substitution rule:', error)
      return NextResponse.json({ error: 'Failed to delete substitution rule' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Substitution rules DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
