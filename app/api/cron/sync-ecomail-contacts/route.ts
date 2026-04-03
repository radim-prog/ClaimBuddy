import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { syncContact } from '@/lib/marketing-service'
import { verifyCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// Enhanced cron: sync all active users to Ecomail with tags and segmentation
// Called daily via Vercel cron or external scheduler
export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  if (!process.env.ECOMAIL_API_KEY) {
    return NextResponse.json({ message: 'Ecomail not configured, skipping' })
  }

  // Fetch all active users with email
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('status', 'active')
    .not('email', 'is', null)

  if (!users?.length) {
    return NextResponse.json({ synced: 0 })
  }

  let synced = 0
  let errors = 0
  const errorDetails: string[] = []

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(user => syncContact(user.id))
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.synced) {
        synced++
      } else {
        errors++
        if (result.status === 'fulfilled' && result.value.error) {
          errorDetails.push(result.value.error)
        }
      }
    }

    // Brief pause between batches
    if (i + batchSize < users.length) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  return NextResponse.json({
    synced,
    errors,
    total: users.length,
    ...(errorDetails.length > 0 && { errorSample: errorDetails.slice(0, 5) }),
  })
}
