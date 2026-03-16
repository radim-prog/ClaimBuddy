export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBridgeKey, bridgeError, logBridgeCall } from '@/lib/bridge-auth'

// GET /api/bridge/companies — List companies (for n8n workflows)
// Query params: status (default 'active', or 'all'), limit (max 500), offset
export async function GET(request: NextRequest) {
  const auth = validateBridgeKey(request)
  if (!auth.valid) return bridgeError(auth.error!, 401)
  logBridgeCall('GET', '/api/bridge/companies', auth.context!)

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status') || 'active'
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('companies')
    .select('id, name, ico, dic, legal_form, status, accountant_id, group_name, monthly_reporting, created_at', { count: 'exact' })
    .order('name')
    .range(offset, offset + limit - 1)

  if (status !== 'all') query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return bridgeError(error.message, 500)

  return NextResponse.json({ data: data || [], count, limit, offset })
}
