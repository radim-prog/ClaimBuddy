import { test, expect } from '@playwright/test'

test.describe('Monetization API — Subscription', () => {
  // Uses storageState from auth.setup.ts (authenticated requests)

  test('GET /api/subscription/trial returns trial status', async ({ request }) => {
    const response = await request.get('/api/subscription/trial')
    // 200 or 429 (rate limited when running full suite)
    expect([200, 429]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      expect(body).toHaveProperty('trial')
      expect(body).toHaveProperty('monetization_enabled')
    }
  })

  test('GET /api/subscription/credits returns credit packs', async ({ request }) => {
    const response = await request.get('/api/subscription/credits')
    expect([200, 429]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      expect(body).toHaveProperty('packs')
      expect(Array.isArray(body.packs)).toBe(true)
      expect(body.packs.length).toBe(2)
    }
  })
})

test.describe('Monetization API — Stripe', () => {
  test('POST /api/stripe/checkout with auth returns URL or config error', async ({ request }) => {
    const response = await request.post('/api/stripe/checkout', {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ tier: 'profi', cycle: 'monthly' }),
    })
    // 200 with URL (Stripe configured), 503 (not configured), or 429 (rate limited)
    expect([200, 429, 503]).toContain(response.status())
  })

  test('POST /api/stripe/webhook without signature rejects', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      headers: { 'Content-Type': 'application/json' },
      data: '{}',
    })
    // Should not return 200 — must fail signature check
    expect(response.status()).not.toBe(200)
  })
})

test.describe('Monetization API — Cron Security', () => {
  test('trial-expiry without CRON_SECRET returns 401', async ({ request }) => {
    const response = await request.get('/api/cron/trial-expiry')
    expect(response.status()).toBe(401)
  })

  test('credits-reset without CRON_SECRET returns 401', async ({ request }) => {
    const response = await request.get('/api/cron/credits-reset')
    expect(response.status()).toBe(401)
  })

  test('trial-expiry with wrong CRON_SECRET returns 401', async ({ request }) => {
    const response = await request.get('/api/cron/trial-expiry', {
      headers: { Authorization: 'Bearer wrong-secret-12345' },
    })
    expect(response.status()).toBe(401)
  })

  test('credits-reset with wrong CRON_SECRET returns 401', async ({ request }) => {
    const response = await request.get('/api/cron/credits-reset', {
      headers: { Authorization: 'Bearer wrong-secret-12345' },
    })
    expect(response.status()).toBe(401)
  })
})

test.describe('Monetization API — Middleware PUBLIC_PATHS', () => {
  test('/pricing is accessible without auth', async ({ page }) => {
    const response = await page.goto('/pricing')
    expect(response?.status()).toBe(200)
  })

  test('/api/health is public', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
  })

  test('/api/stripe/webhook is in PUBLIC_PATHS (no redirect)', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      headers: { 'Content-Type': 'application/json' },
      data: '{}',
    })
    // Should NOT be 307 redirect — webhook is in PUBLIC_PATHS
    expect(response.status()).not.toBe(307)
  })
})
