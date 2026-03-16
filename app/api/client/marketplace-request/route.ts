import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// POST: Client sends matchmaking request to a marketplace provider
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { provider_id, company_id, message, business_type, budget_range } = body

    if (!provider_id) {
      return NextResponse.json({ error: 'Missing provider_id' }, { status: 400 })
    }

    // Verify provider exists and is verified
    const { data: provider } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id, name, status, capacity_status')
      .eq('id', provider_id)
      .single()

    if (!provider || provider.status !== 'verified') {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (provider.capacity_status === 'full') {
      return NextResponse.json({ error: 'Tato účetní firma momentálně nepřijímá nové klienty' }, { status: 400 })
    }

    // Check for existing pending request
    const { data: existing } = await supabaseAdmin
      .from('marketplace_requests')
      .select('id')
      .eq('client_user_id', userId)
      .eq('provider_id', provider_id)
      .eq('status', 'pending')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Již máte aktivní žádost u tohoto účetního' }, { status: 409 })
    }

    // Rate limit: max 5 pending requests per client
    const { count } = await supabaseAdmin
      .from('marketplace_requests')
      .select('id', { count: 'exact', head: true })
      .eq('client_user_id', userId)
      .eq('status', 'pending')

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Příliš mnoho aktivních žádostí. Vyčkejte na odpověď.' }, { status: 429 })
    }

    const { data, error } = await supabaseAdmin
      .from('marketplace_requests')
      .insert({
        client_user_id: userId,
        client_company_id: company_id || null,
        provider_id,
        message: message || null,
        business_type: business_type || null,
        budget_range: budget_range || null,
      })
      .select('id, status, created_at')
      .single()

    if (error) {
      // Unique constraint violation = duplicate pending
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Již máte aktivní žádost u tohoto účetního' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    console.error('[MarketplaceRequest] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Client sees their own requests
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('marketplace_requests')
      .select('id, provider_id, status, message, created_at, responded_at, rejection_reason, marketplace_providers(name, city)')
      .eq('client_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    const requests = (data || []).map((r: any) => ({
      id: r.id,
      provider_id: r.provider_id,
      provider_name: r.marketplace_providers?.name || null,
      provider_city: r.marketplace_providers?.city || null,
      status: r.status,
      message: r.message,
      created_at: r.created_at,
      responded_at: r.responded_at,
      rejection_reason: r.rejection_reason,
    }))

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('[MarketplaceRequest] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
