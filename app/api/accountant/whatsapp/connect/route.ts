import { NextRequest, NextResponse } from 'next/server'
import { getConnectionState, connectInstance, disconnectInstance, isWhatsAppConfigured } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

/**
 * GET  — Check connection state or get QR code
 * POST — Trigger connect (returns QR)
 * DELETE — Disconnect WhatsApp instance
 */
export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json({ configured: false, state: 'not_configured' })
  }

  try {
    const state = await getConnectionState()
    return NextResponse.json({
      configured: true,
      state: state.instance.state,
      instanceName: state.instance.instanceName,
    })
  } catch (err) {
    return NextResponse.json({
      configured: true,
      state: 'error',
      error: err instanceof Error ? err.message : 'Connection check failed',
    })
  }
}

export async function POST(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 })
  }

  try {
    // Check if already connected
    const state = await getConnectionState()
    if (state.instance.state === 'open') {
      return NextResponse.json({
        state: 'open',
        message: 'Already connected',
      })
    }

    // Trigger connection — returns QR code
    const qr = await connectInstance()
    return NextResponse.json({
      state: 'connecting',
      qr: {
        base64: qr.base64 || null,
        pairingCode: qr.pairingCode || null,
      },
      count: qr.count,
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Connection failed',
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (userRole !== 'admin' && userRole !== 'accountant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await disconnectInstance()
    return NextResponse.json({ success: true, state: 'close' })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Disconnect failed',
    }, { status: 500 })
  }
}
