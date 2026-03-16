import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = request.headers.get('x-user-role')
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { group_name, billing_company_id } = body

    if (!group_name || !billing_company_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('company_groups')
      .upsert(
        {
          group_name,
          billing_company_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'group_name' }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Billing entity update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
