import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { description, category, url, userAgent, viewport, logs, timestamp } = body

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description required (min 10 chars)' }, { status: 400 })
    }

    if (description.length > 2000) {
      return NextResponse.json({ error: 'Description too long' }, { status: 400 })
    }

    const userId = request.headers.get('x-user-id') || null
    const userRole = request.headers.get('x-user-role') || null

    const { error } = await supabaseAdmin.from('bug_reports').insert({
      user_id: userId,
      user_role: userRole,
      description: description.trim(),
      category: category || null,
      url: typeof url === 'string' ? url.slice(0, 2000) : null,
      user_agent: typeof userAgent === 'string' ? userAgent.slice(0, 500) : null,
      viewport: typeof viewport === 'string' ? viewport.slice(0, 50) : null,
      client_logs: Array.isArray(logs) ? logs.slice(0, 500) : [],
      status: 'new',
    })

    if (error) {
      console.error('[bug-report] Supabase insert error:', error.message)
      return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
