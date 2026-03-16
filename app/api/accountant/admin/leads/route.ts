import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function isAdmin(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  return role === 'admin'
}

// GET /api/accountant/admin/leads — list all leads
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const status = request.nextUrl.searchParams.get('status')

  let query = supabaseAdmin
    .from('accountant_leads')
    .select(`
      *,
      users:user_id (name, email),
      companies:company_id (name, ico)
    `)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data ?? [] })
}

// PATCH /api/accountant/admin/leads — update lead status
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { id, status, admin_note } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status) updates.status = status
  if (admin_note !== undefined) updates.admin_note = admin_note

  const { data, error } = await supabaseAdmin
    .from('accountant_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}
