import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-user-role') === 'admin'
}

// GET — admin list all marketplace providers (all statuses)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, verified, rejected, suspended, all

    let query = supabaseAdmin
      .from('marketplace_providers')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Admin marketplace GET]', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    const providers = (data || []).map((p: any) => ({
      ...p,
      registered_by_name: p.users?.full_name || null,
      registered_by_email: p.users?.email || null,
    }))

    return NextResponse.json({ providers })
  } catch (error) {
    console.error('[Admin marketplace GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — admin verify/reject/suspend a provider
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const body = await request.json()
    const { id, action, rejection_reason, featured, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    // Action-based updates
    if (action === 'verify') {
      const { error } = await supabaseAdmin
        .from('marketplace_providers')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: userId,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
      return NextResponse.json({ success: true, status: 'verified' })
    }

    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('marketplace_providers')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
      return NextResponse.json({ success: true, status: 'rejected' })
    }

    if (action === 'suspend') {
      const { error } = await supabaseAdmin
        .from('marketplace_providers')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) return NextResponse.json({ error: 'Failed to suspend' }, { status: 500 })
      return NextResponse.json({ success: true, status: 'suspended' })
    }

    // Non-action updates (featured, sort_order)
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof featured === 'boolean') updates.featured = featured
    if (typeof sort_order === 'number') updates.sort_order = sort_order

    if (Object.keys(updates).length > 1) {
      const { error } = await supabaseAdmin
        .from('marketplace_providers')
        .update(updates)
        .eq('id', id)

      if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No valid action or fields provided' }, { status: 400 })
  } catch (error) {
    console.error('[Admin marketplace PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
