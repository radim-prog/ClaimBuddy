// Raynet CRM cron jobs — imported in instrumentation.ts
// Runs only on server side

import cron from 'node-cron'

let initialized = false
let consecutiveFailures = 0
let circuitOpenUntil = 0
const MAX_FAILURES = 3
const CIRCUIT_OPEN_MS = 15 * 60 * 1000 // 15 minutes

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
    // Circuit breaker: skip if too many consecutive failures
    if (consecutiveFailures >= MAX_FAILURES && Date.now() < circuitOpenUntil) {
      return
    }
    if (consecutiveFailures >= MAX_FAILURES) {
      console.log('[Raynet Cron] Circuit breaker reset, retrying...')
      consecutiveFailures = 0
    }

    try {
      const res = await fetch(`${baseUrl}/api/cron/raynet-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
      }

      const text = await res.text()
      if (!text) {
        consecutiveFailures = 0
        return
      }

      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`)
      }

      consecutiveFailures = 0
      if (data.synced > 0 || data.updated > 0) {
        console.log(`[Raynet Cron] Synced: ${data.synced}, Updated: ${data.updated}`)
      }
    } catch (err) {
      consecutiveFailures++
      if (consecutiveFailures >= MAX_FAILURES) {
        circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS
        console.error(`[Raynet Cron] ${consecutiveFailures} consecutive failures, pausing for 15 min:`, err)
      } else {
        console.error(`[Raynet Cron] Sync failed (${consecutiveFailures}/${MAX_FAILURES}):`, err)
      }
    }
  })

}
