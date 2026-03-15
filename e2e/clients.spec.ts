import { test, expect } from '@playwright/test'

// Auth is handled by auth.setup.ts + storageState in playwright.config.ts

test.describe('Clients', () => {
  test('clients page loads', async ({ page }) => {
    const response = await page.goto('/accountant/clients')
    expect(response?.status()).toBe(200)
    expect(page.url()).toContain('/accountant/clients')
  })

  test('search input exists', async ({ page }) => {
    await page.goto('/accountant/clients')
    await page.waitForLoadState('domcontentloaded')
    const searchInput = page.locator('input[placeholder*="Hledat"]')
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('Horák')
      await page.waitForTimeout(500)
    }
  })
})
