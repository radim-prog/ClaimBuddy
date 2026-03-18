import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/client/account/cancel-deletion
 * Cancel a pending account deletion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token je povinný' }, { status: 400 })
    }

    // Find user with matching cancel token
    const { data: user, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('id, status')
      .eq('deletion_cancel_token', token)
      .eq('status', 'deletion_pending')
      .single()

    if (fetchErr || !user) {
      return NextResponse.json({ error: 'Neplatný nebo expirovaný token' }, { status: 404 })
    }

    // Restore account
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({
        status: 'active',
        deletion_requested_at: null,
        deletion_cancel_token: null,
      })
      .eq('id', user.id)

    if (updateErr) throw updateErr

    // Audit log
    await supabaseAdmin.from('gdpr_deletion_log').insert({
      user_id: user.id,
      user_email_hash: 'cancelled',
      action: 'cancelled',
    })

    return NextResponse.json({
      success: true,
      message: 'Smazání účtu bylo zrušeno. Váš účet je opět aktivní.',
    })
  } catch (error) {
    console.error('[cancel-deletion POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
