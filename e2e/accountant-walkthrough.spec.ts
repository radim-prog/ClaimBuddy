import { test, expect } from '@playwright/test'

// Uses admin auth (radim/admin123) via chromium project

test.describe('M4: Accountant Portal Walkthrough', () => {
  test('dashboard loads with widgets', async ({ page }) => {
    await page.goto('/accountant/dashboard')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    // Dashboard should have content
    const content = await main.textContent()
    expect(content?.length).toBeGreaterThan(50)
    await page.screenshot({ path: 'test-results/m4-dashboard.png', fullPage: true })
  })

  test('clients page loads and shows list or empty state', async ({ page }) => {
    await page.goto('/accountant/clients')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    // Page should show either client rows or empty state message
    const content = await main.textContent()
    expect(content?.length).toBeGreaterThan(10)
    await page.screenshot({ path: 'test-results/m4-clients.png', fullPage: true })
  })

  test('client detail page accessible', async ({ page }) => {
    await page.goto('/accountant/clients')
    await page.waitForLoadState('networkidle')
    // Dismiss cookie banner if present
    const acceptCookies = page.locator('button').filter({ hasText: /^OK$/ })
    if (await acceptCookies.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptCookies.click()
      await page.waitForTimeout(500)
    }
    await page.waitForTimeout(2000)
    // Click first client link with UUID (if clients exist in DB)
    const clientLink = page.locator('main a[href*="/accountant/clients/"]').first()
    const hasClients = await clientLink.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasClients) {
      const href = await clientLink.getAttribute('href')
      if (href && href.length > '/accountant/clients/'.length) {
        await clientLink.click({ force: true })
        await page.waitForLoadState('networkidle')
        expect(page.url()).toContain('/accountant/clients/')
      }
    }
    // Verify clients page itself loaded regardless
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/m4-client-detail.png', fullPage: true })
  })

  test('closures matrix loads', async ({ page }) => {
    await page.goto('/accountant/closures')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m4-closures.png', fullPage: true })
  })

  test('komunikace page loads', async ({ page }) => {
    await page.goto('/accountant/komunikace')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m4-komunikace.png', fullPage: true })
  })

  test('sidebar navigation — all main sections load', async ({ page }) => {
    const sections = [
      { path: '/accountant/dashboard', name: 'Přehled' },
      { path: '/accountant/clients', name: 'Klienti' },
      { path: '/accountant/work', name: 'Práce' },
      { path: '/accountant/calendar', name: 'Kalendář' },
      { path: '/accountant/settings', name: 'Nastavení' },
    ]

    for (const section of sections) {
      const response = await page.goto(section.path)
      expect(response?.status()).toBeLessThan(400)
      await page.waitForLoadState('domcontentloaded')
    }
    await page.screenshot({ path: 'test-results/m4-navigation.png' })
  })
})
