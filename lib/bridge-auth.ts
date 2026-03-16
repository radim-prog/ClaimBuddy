import { NextRequest, NextResponse } from 'next/server'

export interface BridgeContext {
  bridgeKeyName: string    // which key was used (for logging)
  permissions: string[]     // what this key can do
}

/**
 * Validate X-Bridge-Key header against BRIDGE_SECRET env var.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function validateBridgeKey(request: NextRequest): { valid: boolean; context?: BridgeContext; error?: string } {
  const bridgeKey = request.headers.get('x-bridge-key')
  if (!bridgeKey) return { valid: false, error: 'Missing X-Bridge-Key header' }

  const expectedKey = process.env.BRIDGE_SECRET
  if (!expectedKey) return { valid: false, error: 'Bridge API not configured' }

  // Use timing-safe comparison
  if (!timingSafeEqual(bridgeKey, expectedKey)) {
    return { valid: false, error: 'Invalid bridge key' }
  }

  return {
    valid: true,
    context: {
      bridgeKeyName: 'default',
      permissions: ['read:companies', 'read:closures', 'read:users', 'write:documents', 'trigger:extraction'],
    },
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Compares byte-by-byte with constant-time XOR.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const encoder = new TextEncoder()
  const bufA = encoder.encode(a)
  const bufB = encoder.encode(b)
  let diff = 0
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i]
  }
  return diff === 0
}

/** Helper to create a standardized error response */
export function bridgeError(message: string, status: number) {
  return NextResponse.json(
    { error: message, timestamp: new Date().toISOString() },
    { status },
  )
}

/** Log bridge API call to console (structured) */
export function logBridgeCall(method: string, path: string, bridgeContext: BridgeContext) {
  console.log(`[Bridge API] ${method} ${path} — key: ${bridgeContext.bridgeKeyName}`)
}
