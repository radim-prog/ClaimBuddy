import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET /api/users — list staff users (for assignee dropdowns)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('role', ['accountant', 'admin', 'assistant', 'junior', 'senior'])
      .order('name')

    if (error) throw error

    return NextResponse.json({ users: data ?? [] })
  } catch (error) {
    console.error('[Users] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
