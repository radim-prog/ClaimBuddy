import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/extraction/settings — Get current extraction settings
 * POST /api/extraction/settings — Update extraction settings
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('extraction_settings')
      .select('*')
      .order('is_active', { ascending: false })

    if (error) {
      // Table might not exist yet — return defaults
      return NextResponse.json({
        settings: {
          provider: process.env.AI_EXTRACTION_PROVIDER || 'openai',
          model: process.env.AI_EXTRACTION_MODEL || 'gpt-4o-mini',
          has_api_key: !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
          has_ocr_key: !!process.env.ZAI_API_KEY,
          is_active: true,
          cron_enabled: false,
          cron_time: '02:00',
          max_concurrent: 5,
        },
      })
    }

    const active = (data || [])[0]

    return NextResponse.json({
      settings: active ? {
        id: active.id,
        provider: active.provider,
        model: active.model,
        has_api_key: !!active.api_key,
        has_ocr_key: !!active.ocr_api_key,
        is_active: active.is_active,
        cron_enabled: active.cron_enabled || false,
        cron_time: active.cron_time || '02:00',
        max_concurrent: active.max_concurrent || 5,
      } : null,
      all: (data || []).map(s => ({
        id: s.id,
        provider: s.provider,
        model: s.model,
        is_active: s.is_active,
      })),
    })
  } catch (error) {
    console.error('[Extraction Settings] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { provider, model, api_key, ocr_api_key, cron_enabled, cron_time, max_concurrent } = body

    if (!provider || !model) {
      return NextResponse.json({ error: 'provider and model are required' }, { status: 400 })
    }

    // Deactivate all existing
    await supabaseAdmin
      .from('extraction_settings')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // match all

    // Upsert new active config
    const { data, error } = await supabaseAdmin
      .from('extraction_settings')
      .upsert({
        provider,
        model,
        ...(api_key ? { api_key } : {}),
        ...(ocr_api_key ? { ocr_api_key } : {}),
        is_active: true,
        cron_enabled: cron_enabled ?? false,
        cron_time: cron_time || '02:00',
        max_concurrent: max_concurrent || 5,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'provider,model',
      })
      .select()
      .single()

    if (error) {
      console.error('[Extraction Settings] Upsert error:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    console.error('[Extraction Settings] POST Error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
