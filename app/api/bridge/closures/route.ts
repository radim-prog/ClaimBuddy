export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBridgeKey, bridgeError, logBridgeCall } from '@/lib/bridge-auth'

// GET /api/bridge/closures — List closures with filters (for n8n dashboards)
// Query params: period (e.g. '2026-03'), company_id, limit (max 1000)
export async function GET(request: NextRequest) {
  const auth = validateBridgeKey(request)
  if (!auth.valid) return bridgeError(auth.error!, 401)
  logBridgeCall('GET', '/api/bridge/closures', auth.context!)

  const { searchParams } = request.nextUrl
  const period = searchParams.get('period')
  const companyId = searchParams.get('company_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 1000)

  let query = supabaseAdmin
    .from('monthly_closures')
    .select('*, companies(name, ico)')
    .order('period', { ascending: false })
    .limit(limit)

  if (period) query = query.eq('period', period)
  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query
  if (error) return bridgeError(error.message, 500)

  return NextResponse.json({ data: data || [] })
}
