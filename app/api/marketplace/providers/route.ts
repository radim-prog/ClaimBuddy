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

    // Enrich with average ratings
    const providerIds = providers.map(p => p.id)
    let ratingMap = new Map<string, { avg: number; count: number }>()

    if (providerIds.length > 0) {
      const { data: reviews } = await supabaseAdmin
        .from('marketplace_reviews')
        .select('provider_id, rating')
        .in('provider_id', providerIds)

      if (reviews) {
        const byProvider = new Map<string, number[]>()
        for (const r of reviews) {
          const arr = byProvider.get(r.provider_id) || []
          arr.push(r.rating)
          byProvider.set(r.provider_id, arr)
        }
        for (const [pid, ratings] of byProvider) {
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
          ratingMap.set(pid, { avg: Math.round(avg * 10) / 10, count: ratings.length })
        }
      }
    }

    const enriched = providers.map(p => ({
      ...p,
      rating_avg: ratingMap.get(p.id)?.avg || null,
      rating_count: ratingMap.get(p.id)?.count || 0,
    }))

    return NextResponse.json({ providers: enriched })
  } catch (error) {
    console.error('[Marketplace providers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
