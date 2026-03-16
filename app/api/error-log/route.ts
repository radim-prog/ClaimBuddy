import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/error-logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { message } = body
    if (!message || typeof message !== 'string' || message.length > 5000) {
      return NextResponse.json({ error: 'Invalid error log' }, { status: 400 })
    }

    await logError({
      level: 'error',
      message: body.message || 'Unknown client error',
      stack: body.stack,
      digest: body.digest,
      url: body.url,
      source: body.source || 'client',
      user_id: request.headers.get('x-user-id'),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
