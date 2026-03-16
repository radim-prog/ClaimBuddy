import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// POST: Client submits review for their assigned accountant's provider
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { provider_id, rating, review_text } = body

    if (!provider_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Missing provider_id or invalid rating (1-5)' }, { status: 400 })
    }

    // Verify provider exists
    const { data: provider } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id, user_id')
      .eq('id', provider_id)
      .single()

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Check if client is assigned to this accountant (verified_client)
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('id, assigned_accountant_id')
      .eq('owner_id', userId)

    const isVerifiedClient = (companies || []).some(
      c => c.assigned_accountant_id === provider.user_id
    )

    // Also check via accepted marketplace_requests
    let hasAcceptedRequest = false
    if (!isVerifiedClient) {
      const { data: accepted } = await supabaseAdmin
        .from('marketplace_requests')
        .select('id')
        .eq('client_user_id', userId)
        .eq('provider_id', provider_id)
        .eq('status', 'accepted')
        .limit(1)

      hasAcceptedRequest = (accepted && accepted.length > 0) || false
    }

    if (!isVerifiedClient && !hasAcceptedRequest) {
      return NextResponse.json({ error: 'Můžete hodnotit pouze svého účetního' }, { status: 403 })
    }

    // Check for existing review
    const { data: existing } = await supabaseAdmin
      .from('marketplace_reviews')
      .select('id')
      .eq('provider_id', provider_id)
      .eq('reviewer_user_id', userId)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing review
      const { error } = await supabaseAdmin
        .from('marketplace_reviews')
        .update({
          rating: Math.round(rating),
          review_text: review_text || null,
          verified_client: isVerifiedClient || hasAcceptedRequest,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id)

      if (error) throw error
      return NextResponse.json({ success: true, updated: true })
    }

    // Create new review
    const { error } = await supabaseAdmin
      .from('marketplace_reviews')
      .insert({
        provider_id,
        reviewer_user_id: userId,
        rating: Math.round(rating),
        review_text: review_text || null,
        verified_client: isVerifiedClient || hasAcceptedRequest,
      })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Již jste tuto firmu hodnotili' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('[MarketplaceReview] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Get reviews for a provider (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('provider_id')

    if (!providerId) {
      return NextResponse.json({ error: 'Missing provider_id' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('marketplace_reviews')
      .select('id, rating, review_text, verified_client, created_at, users!reviewer_user_id(name)')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // Fallback without join
      const { data: fb, error: fbErr } = await supabaseAdmin
        .from('marketplace_reviews')
        .select('id, rating, review_text, verified_client, created_at')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (fbErr) throw fbErr
      return NextResponse.json({ reviews: fb || [] })
    }

    const reviews = (data || []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      review_text: r.review_text,
      verified_client: r.verified_client,
      reviewer_name: r.users?.name || 'Anonymní',
      created_at: r.created_at,
    }))

    // Compute average
    const ratings = reviews.map(r => r.rating)
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

    return NextResponse.json({
      reviews,
      stats: {
        count: ratings.length,
        average: avgRating ? Math.round(avgRating * 10) / 10 : null,
      },
    })
  } catch (error) {
    console.error('[MarketplaceReview] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
