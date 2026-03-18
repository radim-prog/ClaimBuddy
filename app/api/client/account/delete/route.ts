import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/client/account/delete
 * Request account deletion (GDPR Article 17)
 * 30-day grace period before actual deletion
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Heslo je povinné' }, { status: 400 })
    }

    // Fetch user with password_hash
    const { data: user, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, status')
      .eq('id', userId)
      .single()

    if (fetchErr || !user) {
      return NextResponse.json({ error: 'Uživatel nenalezen' }, { status: 404 })
    }

    if (user.status === 'deletion_pending') {
      return NextResponse.json({ error: 'Žádost o smazání již byla podána' }, { status: 409 })
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Nesprávné heslo' }, { status: 403 })
    }

    // Generate cancellation token
    const cancelToken = crypto.randomUUID()

    // Update user status
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({
        status: 'deletion_pending',
        deletion_requested_at: new Date().toISOString(),
        deletion_cancel_token: cancelToken,
      })
      .eq('id', userId)

    if (updateErr) throw updateErr

    // Audit log
    const emailHash = crypto.createHash('sha256').update(user.email).digest('hex')
    await supabaseAdmin.from('gdpr_deletion_log').insert({
      user_id: userId,
      user_email_hash: emailHash,
      action: 'requested',
    })

    return NextResponse.json({
      success: true,
      cancel_token: cancelToken,
      message: 'Účet bude smazán za 30 dní. Můžete smazání zrušit pomocí cancel tokenu.',
    })
  } catch (error) {
    console.error('[account/delete POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
