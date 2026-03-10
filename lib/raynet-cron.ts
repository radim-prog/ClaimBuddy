// Raynet CRM cron jobs — imported in instrumentation.ts
// Runs only on server side

import cron from 'node-cron'

let initialized = false

export function initRaynetCron() {
  if (initialized) return
  initialized = true

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn('[Raynet Cron] CRON_SECRET not set, skipping cron setup')
    return
  }

  // Check if Raynet credentials are configured
  if (!process.env.RAYNET_API_KEY || !process.env.RAYNET_EMAIL) {
    console.warn('[Raynet Cron] Raynet credentials not set, skipping cron setup')
    return
  }

  const baseUrl = `http://localhost:${process.env.PORT || 3003}`

  // Every 5 minutes, 8:00-19:59
  cron.schedule('*/5 8-19 * * *', async () => {
    try {
      const res = await fetch(`${baseUrl}/api/cron/raynet-sync?secret=${cronSecret}`)
      const data = await res.json()
      if (data.synced > 0 || data.updated > 0) {
        console.log(`[Raynet Cron] Sync: ${data.synced} processed, ${data.updated} updated`)
      }
    } catch (err) {
      console.error('[Raynet Cron] Sync failed:', err)
    }
  })

  // 1st day of month at 8:00 — auto-create handled inside cron endpoint
  // (the */5 cron already runs at 8:00 on day 1, which triggers createMonthlyBCs)

  console.log('[Raynet Cron] Initialized: sync every 5 min (8-20h)')
}
