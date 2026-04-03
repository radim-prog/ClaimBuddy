import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/account-cleanup
 * GDPR: Anonymize accounts 30 days after deletion request
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Find accounts pending deletion for 30+ days
    const { data: users, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('status', 'deletion_pending')
      .lt('deletion_requested_at', thirtyDaysAgo)

    if (fetchErr) throw fetchErr
    if (!users || users.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No accounts to clean up' })
    }

    let processed = 0
    for (const user of users) {
      const emailHash = crypto.createHash('sha256').update(user.email).digest('hex')

      // Anonymize user record
      const { error: updateErr } = await supabaseAdmin
        .from('users')
        .update({
          name: 'Smazaný uživatel',
          email: `deleted_${user.id}@deleted.local`,
          login_name: `deleted_${user.id}`,
          password_hash: null,
          phone: null,
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          deletion_cancel_token: null,
          notification_preferences: null,
          telegram_chat_id: null,
        })
        .eq('id', user.id)

      if (updateErr) {
        console.error(`[account-cleanup] Failed to anonymize user ${user.id}:`, updateErr)
        continue
      }

      // Anonymize chat messages
      await supabaseAdmin
        .from('chat_messages')
        .update({ content: '[smazáno]' })
        .eq('sender_id', user.id)

      // Anonymize travel trips purpose
      const { data: userCompanies } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
      if (userCompanies?.length) {
        await supabaseAdmin
          .from('travel_trips')
          .update({ purpose: null })
          .in('company_id', userCompanies.map(c => c.id))
      }

      // Audit log
      await supabaseAdmin.from('gdpr_deletion_log').insert({
        user_id: user.id,
        user_email_hash: emailHash,
        action: 'completed',
        anonymized_tables: ['users', 'chat_messages', 'travel_trips'],
      })

      processed++
    }

    return NextResponse.json({ processed, message: `Anonymized ${processed} accounts` })
  } catch (error) {
    console.error('[account-cleanup GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
