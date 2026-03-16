export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { checkSigniConnection } from '@/lib/signi-client'

/**
 * GET /api/accountant/signing/settings
 * Get Signi settings for accountant
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Load user's Signi API key
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('signi_api_key')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Signing Settings GET] Error loading user:', error)
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }

    const key = user?.signi_api_key || null
    let connected = false

    if (key) {
      try {
        const result = await checkSigniConnection(key)
        connected = result.connected
      } catch {
        connected = false
      }
    }

    return NextResponse.json({
      configured: !!key,
      connected,
      key_preview: key ? '***' + key.slice(-4) : null,
    })
  } catch (error) {
    console.error('[Signing Settings GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/accountant/signing/settings
 * Save Signi API key
 */
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { signi_api_key } = body

    if (!signi_api_key || typeof signi_api_key !== 'string' || !signi_api_key.trim()) {
      return NextResponse.json({ error: 'signi_api_key is required' }, { status: 400 })
    }

    const trimmedKey = signi_api_key.trim()

    // Test connection first
    const connectionResult = await checkSigniConnection(trimmedKey)

    if (!connectionResult.connected) {
      return NextResponse.json({
        error: 'Failed to connect to Signi with provided API key',
        details: connectionResult.error,
      }, { status: 400 })
    }

    // Save the key
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ signi_api_key: trimmedKey })
      .eq('id', userId)

    if (updateError) {
      console.error('[Signing Settings PUT] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true, connected: true })
  } catch (error) {
    console.error('[Signing Settings PUT] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
