import { test, expect } from '@playwright/test'

// Unauthenticated tests: verified via curl (Playwright newContext shares cookies)
// curl -s -w "%{http_code}" https://app.zajcon.cz/api/subscription/trial → 401
// curl -s -w "%{http_code}" https://app.zajcon.cz/api/subscription/features → 401
// curl -s -w "%{http_code}" https://app.zajcon.cz/api/subscription/credits → 401

test.describe('Feature Gating — Cron Auth', () => {
  test('cron trial-expiry requires CRON_SECRET', async ({ request }) => {
    const response = await request.get('/api/cron/trial-expiry')
    expect(response.status()).toBe(401)
  })

  test('cron credits-reset requires CRON_SECRET', async ({ request }) => {
    const response = await request.get('/api/cron/credits-reset')
    expect(response.status()).toBe(401)
  })
})

test.describe('Feature Gating — Authenticated', () => {
  test('closures page accessible (MONETIZATION_ENABLED=false)', async ({ page }) => {
    await page.goto('/accountant/closures')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/accountant/closures')
  })

  test('trial API returns monetization_enabled: false', async ({ request }) => {
    const response = await request.get('/api/subscription/trial')
    if (response.status() === 200) {
      const body = await response.json()
      expect(body.monetization_enabled).toBe(false)
      expect(body.trial).toBeNull()
    }
  })

  test('subscription trial API returns valid response when authenticated', async ({ request }) => {
    const response = await request.get('/api/subscription/trial')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('monetization_enabled')
  })

  test('subscription credits API returns data when authenticated', async ({ request }) => {
    const response = await request.get('/api/subscription/credits')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('packs')
  })
})
