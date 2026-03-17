import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-user-role') === 'admin'
}

// GET /api/accountant/pipeline — list pipeline items
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const stage = request.nextUrl.searchParams.get('stage')

  let query = supabaseAdmin
    .from('onboarding_pipeline')
    .select('*')
    .order('updated_at', { ascending: false })

  if (stage && stage !== 'all') {
    query = query.eq('stage', stage)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

// POST /api/accountant/pipeline — create new pipeline item
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { company_name, ico, contact_person, contact_email, contact_phone, expected_monthly_fee, stage, note, source, planned_start } = body

  if (!company_name?.trim()) {
    return NextResponse.json({ error: 'company_name required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('onboarding_pipeline')
    .insert({
      company_name: company_name.trim(),
      ico: ico || null,
      contact_person: contact_person || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      expected_monthly_fee: expected_monthly_fee || 0,
      stage: stage || 'lead',
      note: note || null,
      source: source || null,
      planned_start: planned_start || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

// PATCH /api/accountant/pipeline — update pipeline item
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['company_name', 'ico', 'contact_person', 'contact_email', 'contact_phone', 'expected_monthly_fee', 'stage', 'note', 'source', 'planned_start', 'company_id']
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key]
  }

  const { data, error } = await supabaseAdmin
    .from('onboarding_pipeline')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

// DELETE /api/accountant/pipeline — remove pipeline item
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('onboarding_pipeline')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
