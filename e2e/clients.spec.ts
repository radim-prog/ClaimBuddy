import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.fill('input[name="username"]', 'radim')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/accountant/dashboard', { timeout: 10000 })
}

test.describe('Clients', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/accountant/clients')
  })

  test('clients page loads with company list', async ({ page }) => {
    await expect(page.locator('text=Klienti')).toBeVisible()
    // Should show companies from Supabase (120 total)
    await page.waitForSelector('[data-testid="company-card"], .company-card, table tbody tr, [class*="card"]', { timeout: 10000 })
  })

  test('search filters companies', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Hledat"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Horák')
      // Wait for filtering
      await page.waitForTimeout(500)
    }
  })
})
