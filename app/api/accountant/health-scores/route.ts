import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET - cached health scores for all companies
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('id, name, health_score, health_score_breakdown, health_score_updated_at, status')
      .is('deleted_at', null)
      .not('status', 'eq', 'inactive')
      .order('name')

    if (error) throw new Error(error.message)

    const scores = (data ?? []).map(c => ({
      company_id: c.id,
      company_name: c.name,
      score: c.health_score,
      breakdown: c.health_score_breakdown,
      updated_at: c.health_score_updated_at,
    }))

    return NextResponse.json({ scores })
  } catch (error) {
    console.error('Health scores API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
