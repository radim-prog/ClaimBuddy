/**
 * Admin API — Evolution API (WhatsApp) multi-instance management
 *
 * DB table DDL:
 * ---------------------------------------------------------------------------
 * -- evolution_instances: id uuid PK default gen_random_uuid(),
 * --   firm_id uuid NOT NULL REFERENCES accounting_firms(id) ON DELETE CASCADE,
 * --   instance_name text NOT NULL UNIQUE,
 * --   phone_number text,
 * --   status text NOT NULL DEFAULT 'disconnected'
 * --     CHECK (status IN ('connected', 'disconnected', 'connecting')),
 * --   created_at timestamptz NOT NULL DEFAULT now(),
 * --   updated_at timestamptz NOT NULL DEFAULT now()
 * ---------------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Auth guard helper
// ---------------------------------------------------------------------------

function requireAdmin(request: NextRequest): NextResponse | null {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 })
  }
  return null
}

// ---------------------------------------------------------------------------
// GET /api/accountant/admin/whatsapp-instances
// Returns all instances with firm name joined from accounting_firms
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('evolution_instances')
    .select(`
      id,
      firm_id,
      instance_name,
      phone_number,
      status,
      created_at,
      updated_at,
      accounting_firms ( id, name )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[whatsapp-instances GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ instances: data ?? [] })
}

// ---------------------------------------------------------------------------
// POST /api/accountant/admin/whatsapp-instances
// Create a new instance record
// Body: { firm_id: string, instance_name: string, phone_number?: string }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  let body: { firm_id?: string; instance_name?: string; phone_number?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { firm_id, instance_name, phone_number } = body

  if (!firm_id || !firm_id.trim()) {
    return NextResponse.json({ error: 'firm_id is required' }, { status: 400 })
  }
  if (!instance_name || !instance_name.trim()) {
    return NextResponse.json({ error: 'instance_name is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('evolution_instances')
    .insert({
      firm_id: firm_id.trim(),
      instance_name: instance_name.trim(),
      phone_number: phone_number?.trim() ?? null,
      status: 'disconnected',
    })
    .select(`
      id,
      firm_id,
      instance_name,
      phone_number,
      status,
      created_at,
      updated_at,
      accounting_firms ( id, name )
    `)
    .single()

  if (error) {
    console.error('[whatsapp-instances POST]', error)
    // Unique violation on instance_name
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Instance name "${instance_name}" is already taken` },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ instance: data }, { status: 201 })
}

// ---------------------------------------------------------------------------
// PATCH /api/accountant/admin/whatsapp-instances
// Update an existing instance
// Body: { id: string, instance_name?: string, phone_number?: string, status?: string }
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  let body: {
    id?: string
    instance_name?: string
    phone_number?: string
    status?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, ...updates } = body

  if (!id || !id.trim()) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Build sanitized update payload — only allow these fields
  const patch: Record<string, string> = { updated_at: new Date().toISOString() }
  if (updates.instance_name !== undefined) patch.instance_name = updates.instance_name.trim()
  if (updates.phone_number !== undefined) patch.phone_number = updates.phone_number.trim()
  if (updates.status !== undefined) {
    const validStatuses = ['connected', 'disconnected', 'connecting']
    if (!validStatuses.includes(updates.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }
    patch.status = updates.status
  }

  const { data, error } = await supabaseAdmin
    .from('evolution_instances')
    .update(patch)
    .eq('id', id.trim())
    .select(`
      id,
      firm_id,
      instance_name,
      phone_number,
      status,
      created_at,
      updated_at,
      accounting_firms ( id, name )
    `)
    .single()

  if (error) {
    console.error('[whatsapp-instances PATCH]', error)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Instance name "${updates.instance_name}" is already taken` },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  }

  return NextResponse.json({ instance: data })
}

// ---------------------------------------------------------------------------
// DELETE /api/accountant/admin/whatsapp-instances?id=<uuid>
// Remove an instance record
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const id = request.nextUrl.searchParams.get('id')
  if (!id || !id.trim()) {
    return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('evolution_instances')
    .delete()
    .eq('id', id.trim())

  if (error) {
    console.error('[whatsapp-instances DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
