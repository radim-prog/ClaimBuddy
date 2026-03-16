import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { subscribe } from '@/lib/ecomail-client'

export const dynamic = 'force-dynamic'

// Cron endpoint: sync all active users to Ecomail contact list
// Should be called periodically (e.g., daily via Vercel cron or external scheduler)
export async function POST(request: Request) {
  // 1. Auth: Bearer CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check Ecomail config
  const apiKey = process.env.ECOMAIL_API_KEY
  const listId = process.env.ECOMAIL_LIST_ID_CLIENTS
  if (!apiKey || !listId) {
    return NextResponse.json({ message: 'Ecomail not configured, skipping' })
  }

  // 3. Fetch all active users with email
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role')
    .eq('status', 'active')
    .not('email', 'is', null)

  if (!users?.length) {
    return NextResponse.json({ synced: 0 })
  }

  // 4. For each user, subscribe to Ecomail list
  let synced = 0, errors = 0
  const config = { apiKey }

  for (const user of users) {
    // Split name into firstName / lastName (first word = first name, rest = last name)
    const nameParts = (user.name ?? '').trim().split(/\s+/)
    const firstName = nameParts[0] || undefined
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

    try {
      await subscribe(config, listId, {
        email: user.email,
        firstName,
        lastName,
      })
      synced++
    } catch (err) {
      errors++
      console.error(`Ecomail sync failed for ${user.email}:`, err)
    }
  }

  return NextResponse.json({ synced, errors, total: users.length })
}
