import { NextRequest, NextResponse } from 'next/server'
import { getMarketingOverview } from '@/lib/marketing-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET: Fetch marketing overview (lists, campaigns, automations from Ecomail + local stats)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId || userRole !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  try {
    // Ecomail data
    const ecomailData = await getMarketingOverview()

    // Local stats
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: marketingOptIn } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('email', 'is', null)

    // Count by plan
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .in('status', ['active', 'trialing'])

    const planCounts: Record<string, number> = {}
    let trialCount = 0
    for (const sub of subs || []) {
      if (sub.status === 'trialing') trialCount++
      planCounts[sub.plan || 'free'] = (planCounts[sub.plan || 'free'] || 0) + 1
    }

    return NextResponse.json({
      ecomail: ecomailData,
      stats: {
        totalUsers: totalUsers || 0,
        marketingOptIn: marketingOptIn || 0,
        trialUsers: trialCount,
        planCounts,
      },
    })
  } catch (error) {
    console.error('[Marketing API] Overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
