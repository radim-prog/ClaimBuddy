export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ── GET /api/accountant/admin/snapshots
// List all snapshot jobs for a firm, joined with company name
// Query params: firm_id (required)
export async function GET(request: NextRequest) {
  const userId   = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId)               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin')  return NextResponse.json({ error: 'Forbidden' },     { status: 403 })

  const firmId = request.nextUrl.searchParams.get('firm_id')
  if (!firmId) return NextResponse.json({ error: 'firm_id is required' }, { status: 400 })

  const { data: jobs, error } = await supabaseAdmin
    .from('snapshot_jobs')
    .select('*, companies(name)')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Snapshots GET] Error:', error)
    return NextResponse.json({ error: 'Failed to load snapshot jobs' }, { status: 500 })
  }

  return NextResponse.json({ jobs: jobs || [] })
}

// ── POST /api/accountant/admin/snapshots
// Create a new snapshot job
// Body: { firm_id, company_id, schedule, retention_days? }
export async function POST(request: NextRequest) {
  const userId   = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId)               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin')  return NextResponse.json({ error: 'Forbidden' },     { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { firm_id, company_id, schedule, retention_days } = body as {
    firm_id?: string
    company_id?: string
    schedule?: string
    retention_days?: number
  }

  if (!firm_id || !company_id || !schedule) {
    return NextResponse.json({ error: 'firm_id, company_id and schedule are required' }, { status: 400 })
  }

  if (!['daily', 'weekly', 'monthly'].includes(schedule)) {
    return NextResponse.json({ error: 'schedule must be daily, weekly or monthly' }, { status: 400 })
  }

  const { data: job, error } = await supabaseAdmin
    .from('snapshot_jobs')
    .insert({
      firm_id,
      company_id,
      schedule,
      retention_days: typeof retention_days === 'number' && retention_days > 0 ? retention_days : 30,
      enabled: true,
    })
    .select('*, companies(name)')
    .single()

  if (error) {
    console.error('[Snapshots POST] Error:', error)
    return NextResponse.json({ error: 'Failed to create snapshot job' }, { status: 500 })
  }

  return NextResponse.json({ job }, { status: 201 })
}

// ── PATCH /api/accountant/admin/snapshots
// Update a snapshot job
// Query params: id (required)
// Body: { schedule?, retention_days?, enabled? }
export async function PATCH(request: NextRequest) {
  const userId   = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId)               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin')  return NextResponse.json({ error: 'Forbidden' },     { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = ['schedule', 'retention_days', 'enabled']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key]
    }
  }

  if (updates.schedule && !['daily', 'weekly', 'monthly'].includes(updates.schedule as string)) {
    return NextResponse.json({ error: 'schedule must be daily, weekly or monthly' }, { status: 400 })
  }

  const { data: job, error } = await supabaseAdmin
    .from('snapshot_jobs')
    .update(updates)
    .eq('id', id)
    .select('*, companies(name)')
    .single()

  if (error) {
    console.error('[Snapshots PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update snapshot job' }, { status: 500 })
  }

  return NextResponse.json({ job })
}

// ── DELETE /api/accountant/admin/snapshots
// Remove a snapshot job
// Query params: id (required)
export async function DELETE(request: NextRequest) {
  const userId   = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId)               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin')  return NextResponse.json({ error: 'Forbidden' },     { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('snapshot_jobs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Snapshots DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to delete snapshot job' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
