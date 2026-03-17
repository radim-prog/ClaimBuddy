import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET /api/claims/reviews?token=xxx — public, verify token + get case info
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('claim_reviews')
    .select('id, case_id, rating, comment, submitted_at, expires_at, insurance_cases(case_number, insurance_type)')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 })
  }

  return NextResponse.json({
    id: data.id,
    case_id: data.case_id,
    case_number: (data.insurance_cases as Record<string, unknown>)?.case_number ?? null,
    insurance_type: (data.insurance_cases as Record<string, unknown>)?.insurance_type ?? null,
    already_submitted: !!data.submitted_at,
    rating: data.rating,
    comment: data.comment,
  })
}

// POST /api/claims/reviews — public, submit rating
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, rating, comment, client_name } = body

    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    // Verify token exists and is not expired
    const { data: review, error: fetchErr } = await supabaseAdmin
      .from('claim_reviews')
      .select('id, submitted_at, expires_at')
      .eq('token', token)
      .single()

    if (fetchErr || !review) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (review.expires_at && new Date(review.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 410 })
    }

    if (review.submitted_at) {
      return NextResponse.json({ error: 'Review already submitted' }, { status: 409 })
    }

    // Submit the review
    const { error: updateErr } = await supabaseAdmin
      .from('claim_reviews')
      .update({
        rating: Math.round(rating),
        comment: comment?.trim() || null,
        client_name: client_name?.trim() || null,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', review.id)

    if (updateErr) {
      console.error('[Reviews] Submit error:', updateErr)
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
