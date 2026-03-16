import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET — public listing of verified marketplace providers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const specialization = searchParams.get('specialization')
    const capacity = searchParams.get('capacity')
    const search = searchParams.get('search')
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)

    let query = supabaseAdmin
      .from('marketplace_providers')
      .select('id, name, ico, city, region, description, specializations, capacity_status, min_price, max_price, services, logo_url, featured, sort_order')
      .eq('status', 'verified')
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(limit)

    if (city) query = query.ilike('city', `%${city}%`)
    if (capacity) query = query.eq('capacity_status', capacity)
    if (specialization) query = query.contains('specializations', [specialization])

    const { data, error } = await query

    if (error) {
      console.error('[Marketplace providers]', error)
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
    }

    // Client-side text search (name + description)
    let providers = data || []
    if (search) {
      const q = search.toLowerCase()
      providers = providers.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ providers })
  } catch (error) {
    console.error('[Marketplace providers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
