import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - list team members (from users table)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, created_at')
      .order('name')

    if (error) {
      console.error('Error fetching team members:', error)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Transform to TeamMember format
    const members = (users || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      is_active: true,
      created_at: u.created_at,
    }))

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Team API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
