export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/accountant/admin/tenants
 * List all accounting firms with stats (admin only)
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data: firms, error } = await supabaseAdmin
      .from('accounting_firms')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Tenants GET] Error:', error)
      return NextResponse.json({ error: 'Failed to load firms' }, { status: 500 })
    }

    // Enrich each firm with user_count and company_count
    const enriched = await Promise.all((firms || []).map(async (firm) => {
      const [usersRes, companiesRes] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id),
        supabaseAdmin.from('companies').select('id', { count: 'exact', head: true }).eq('firm_id', firm.id),
      ])
      return {
        ...firm,
        user_count: usersRes.count || 0,
        company_count: companiesRes.count || 0,
        drive_connected: !!firm.google_drive_credentials?.refresh_token,
      }
    }))

    return NextResponse.json({ firms: enriched })
  } catch (error) {
    console.error('[Tenants GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/accountant/admin/tenants
 * Create a new accounting firm (admin only)
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { name, ico, dic, email, phone, plan_tier } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Název firmy je povinný' }, { status: 400 })
    }

    const { data: firm, error } = await supabaseAdmin
      .from('accounting_firms')
      .insert({
        name: name.trim(),
        ico: ico?.trim() || null,
        dic: dic?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        plan_tier: plan_tier || 'free',
        status: 'active',
        onboarded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[Tenants POST] Error:', error)
      return NextResponse.json({ error: 'Failed to create firm' }, { status: 500 })
    }

    return NextResponse.json({ firm })
  } catch (error) {
    console.error('[Tenants POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
