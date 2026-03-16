import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { company_id, preferred_location, business_type, budget_range, note, source } = body

  if (!preferred_location && !business_type && !note) {
    return NextResponse.json({ error: 'Vyplňte alespoň jedno pole' }, { status: 400 })
  }

  // Prevent duplicate leads within 24h
  const { data: recent } = await supabaseAdmin
    .from('accountant_leads')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1)

  if (recent && recent.length > 0) {
    return NextResponse.json({ error: 'Už jste nedávno odeslali poptávku. Ozveme se vám.' }, { status: 429 })
  }

  const { data, error } = await supabaseAdmin
    .from('accountant_leads')
    .insert({
      user_id: userId,
      company_id: company_id || null,
      preferred_location: preferred_location || null,
      business_type: business_type || null,
      budget_range: budget_range || null,
      note: note || null,
      source: source || 'find_accountant_form',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ lead: data }, { status: 201 })
}
