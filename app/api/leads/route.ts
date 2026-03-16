export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, company, client_count, source } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Jméno a email jsou povinné' }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Neplatný email' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company?.trim() || null,
        client_count: client_count ? parseInt(client_count, 10) : null,
        source: source || 'website',
      })

    if (error) {
      // Duplicate email — still return success to not leak info
      if (error.code === '23505') {
        return NextResponse.json({ success: true })
      }
      console.error('Lead insert error:', error)
      return NextResponse.json({ error: 'Chyba při ukládání' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Neplatný požadavek' }, { status: 400 })
  }
}
