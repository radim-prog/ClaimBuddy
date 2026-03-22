import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('user_company_visibility')
      .select('company_id')
      .eq('user_id', userId)
      .eq('hidden', true)

    if (error) throw error

    return NextResponse.json({
      hidden_company_ids: (data || []).map((r) => r.company_id),
    })
  } catch (err) {
    console.error('GET company-visibility error:', err)
    return NextResponse.json({ error: 'Failed to fetch visibility' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { company_id, hidden } = await request.json()
    if (!company_id || typeof hidden !== 'boolean') {
      return NextResponse.json({ error: 'Missing company_id or hidden' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('user_company_visibility')
      .upsert(
        {
          user_id: userId,
          company_id,
          hidden,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,company_id' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH company-visibility error:', err)
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 })
  }
}
