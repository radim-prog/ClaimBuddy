import { test, expect } from '@playwright/test'

// Auth is handled by auth.setup.ts + storageState in playwright.config.ts
// NOTE: These tests may fail if the deployed build is stale (JS chunks return 400).
// Run `npm run build && systemctl restart ucetni-webapp.service` before testing.

test.describe('Dashboard', () => {
  test('dashboard redirects correctly for authenticated user', async ({ page }) => {
    const response = await page.goto('/accountant/dashboard')
    // Should not redirect to login (auth cookie is valid)
    expect(page.url()).toContain('/accountant')
    expect(response?.status()).toBe(200)
  })

  test('clients page accessible', async ({ page }) => {
    const response = await page.goto('/accountant/clients')
    expect(response?.status()).toBe(200)
    expect(page.url()).toContain('/accountant/clients')
  })

  test('admin section accessible for admin user', async ({ page }) => {
    await page.goto('/accountant/admin')
    await page.waitForLoadState('domcontentloaded')
    expect(page.url()).toContain('/accountant/admin')
  })
})
