export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { validateBridgeKey, bridgeError, logBridgeCall } from '@/lib/bridge-auth'

// GET /api/bridge — API info and health check
export async function GET(request: NextRequest) {
  const auth = validateBridgeKey(request)
  if (!auth.valid) return bridgeError(auth.error!, 401)
  logBridgeCall('GET', '/api/bridge', auth.context!)

  return NextResponse.json({
    status: 'ok',
    version: '1.0',
    endpoints: [
      { path: '/api/bridge/companies', methods: ['GET'], description: 'List companies' },
      { path: '/api/bridge/closures', methods: ['GET'], description: 'List closures with filters' },
      { path: '/api/bridge/documents', methods: ['POST'], description: 'Upload document metadata' },
      { path: '/api/bridge/extraction', methods: ['POST'], description: 'Trigger document extraction' },
    ],
    timestamp: new Date().toISOString(),
  })
}
