export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBridgeKey, bridgeError, logBridgeCall } from '@/lib/bridge-auth'

// POST /api/bridge/extraction — Trigger document extraction (for AI bot integrations)
// Body: { company_id, document_url, document_type? }
export async function POST(request: NextRequest) {
  const auth = validateBridgeKey(request)
  if (!auth.valid) return bridgeError(auth.error!, 401)
  if (!auth.context!.permissions.includes('trigger:extraction')) {
    return bridgeError('Insufficient permissions', 403)
  }
  logBridgeCall('POST', '/api/bridge/extraction', auth.context!)

  let body: { company_id?: string; document_url?: string; document_type?: string }
  try {
    body = await request.json()
  } catch {
    return bridgeError('Invalid JSON body', 400)
  }

  const { company_id, document_url, document_type } = body

  if (!company_id || !document_url) {
    return bridgeError('company_id and document_url are required', 400)
  }

  // Verify company exists
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id, name')
    .eq('id', company_id)
    .single()

  if (!company) return bridgeError('Company not found', 404)

  // Log the extraction request
  await supabaseAdmin.from('usage_log').insert({
    user_id: '00000000-0000-0000-0000-000000000000', // bridge system user
    action: 'bridge_extraction_trigger',
    resource_id: company_id,
    metadata: { document_url, document_type, source: 'bridge_api' },
  })

  return NextResponse.json({
    status: 'queued',
    company: { id: company.id, name: company.name },
    document_url,
    document_type: document_type || 'auto',
    timestamp: new Date().toISOString(),
  })
}
