export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/accountant/admin/tenants/[firmId]
 * Get single firm detail with users and companies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { firmId } = await params

  const [firmRes, usersRes, companiesRes] = await Promise.all([
    supabaseAdmin.from('accounting_firms').select('*').eq('id', firmId).single(),
    supabaseAdmin.from('users').select('id, name, email, role, plan_tier, created_at').eq('firm_id', firmId).order('created_at'),
    supabaseAdmin.from('companies').select('id, name, ico, status, assigned_accountant_id').eq('firm_id', firmId).order('name'),
  ])

  if (firmRes.error || !firmRes.data) {
    return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
  }

  return NextResponse.json({
    firm: firmRes.data,
    users: usersRes.data || [],
    companies: companiesRes.data || [],
  })
}

/**
 * PATCH /api/accountant/admin/tenants/[firmId]
 * Update a firm
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ firmId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { firmId } = await params
  const body = await request.json()

  // Allowed update fields
  const allowed = ['name', 'ico', 'dic', 'email', 'phone', 'website', 'address', 'logo_url', 'plan_tier', 'billing_email', 'settings', 'status']
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updateData[key] = body[key]
    }
  }

  const { data: firm, error } = await supabaseAdmin
    .from('accounting_firms')
    .update(updateData)
    .eq('id', firmId)
    .select()
    .single()

  if (error) {
    console.error('[Tenants PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update firm' }, { status: 500 })
  }

  return NextResponse.json({ firm })
}
