import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// POST /api/claims/reviews/request — staff-only, create review request
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { case_id } = await request.json()
    if (!case_id) return NextResponse.json({ error: 'case_id is required' }, { status: 400 })

    // Verify the case exists
    const { data: caseData, error: caseErr } = await supabaseAdmin
      .from('insurance_cases')
      .select('id')
      .eq('id', case_id)
      .single()

    if (caseErr || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Check if there's already a pending review request for this case
    const { data: existing } = await supabaseAdmin
      .from('claim_reviews')
      .select('id, submitted_at, expires_at')
      .eq('case_id', case_id)
      .is('submitted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Active review request already exists for this case' }, { status: 409 })
    }

    // Generate a secure random token
    const token = randomBytes(32).toString('hex')

    const { data: review, error: insertErr } = await supabaseAdmin
      .from('claim_reviews')
      .insert({
        case_id,
        token,
        requested_by: userId,
      })
      .select('id, token')
      .single()

    if (insertErr) {
      console.error('[Reviews] Request error:', insertErr)
      return NextResponse.json({ error: 'Failed to create review request' }, { status: 500 })
    }

    const reviewUrl = `${request.nextUrl.origin}/claims/review?token=${token}`

    return NextResponse.json({
      id: review.id,
      token: review.token,
      url: reviewUrl,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
