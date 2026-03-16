import { NextRequest, NextResponse } from 'next/server'
import { downgradeExpiredTrials } from '@/lib/subscription-store'
import { triggerTrialReminder } from '@/lib/marketing-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Cron endpoint: downgrade expired trials to Free
// Should be called daily (e.g., via Vercel cron or external scheduler)
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Send trial reminder emails for trials expiring in 3 days (non-blocking)
    let reminders = 0
    try {
      const reminderDate = new Date()
      reminderDate.setDate(reminderDate.getDate() + 3)
      const reminderDay = reminderDate.toISOString().split('T')[0]

      const { data: expiringTrials } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'trialing')
        .eq('trial_end', reminderDay)

      if (expiringTrials && expiringTrials.length > 0) {
        for (const sub of expiringTrials) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', sub.user_id)
            .single()

          if (user?.email) {
            triggerTrialReminder(user.email).catch(() => {})
            reminders++
          }
        }
      }
    } catch (err) {
      console.error('Trial reminder emails failed (non-critical):', err)
    }

    const downgraded = await downgradeExpiredTrials()
    return NextResponse.json({
      ok: true,
      downgraded,
      reminders,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Trial expiry cron failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
