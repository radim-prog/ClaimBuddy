import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const SETTINGS_KEY = 'email_addresses'

// GET - read email address settings
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single()

    return NextResponse.json({ emails: data?.value ?? null })
  } catch {
    return NextResponse.json({ emails: null })
  }
}

// POST - save email address settings
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { emails } = await request.json()
    if (!emails || typeof emails !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('app_settings')
      .upsert(
        { key: SETTINGS_KEY, value: emails, updated_by: userId, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Error saving email settings:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Email settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
