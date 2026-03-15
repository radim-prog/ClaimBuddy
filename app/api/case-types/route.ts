import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('case_types')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching case types:', error)
      return NextResponse.json({ error: 'Failed to fetch case types' }, { status: 500 })
    }

    return NextResponse.json({ case_types: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'accountant' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, icon, color, description, default_hourly_rate, template_phases } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('case_types')
      .insert({
        name,
        icon: icon || 'folder',
        color: color || 'blue',
        description,
        default_hourly_rate,
        template_phases,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating case type:', error)
      return NextResponse.json({ error: 'Failed to create case type' }, { status: 500 })
    }

    return NextResponse.json({ case_type: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
