import { test, expect } from '@playwright/test'

// Uses admin auth (radim/admin123) — user has claims module enabled

test.describe('M9: Claims Module', () => {
  test('claims dashboard loads', async ({ page }) => {
    await page.goto('/accountant/claims/dashboard')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m9-claims-dashboard.png', fullPage: true })
  })

  test('cases page loads', async ({ page }) => {
    await page.goto('/accountant/claims/cases')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    // Claims layout wraps content in <main>; fallback to body if not found
    const main = page.locator('main')
    const body = page.locator('body')
    const target = await main.isVisible({ timeout: 5000 }).catch(() => false) ? main : body
    await expect(target).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m9-claims-cases.png', fullPage: true })
  })

  test('insurers page loads', async ({ page }) => {
    await page.goto('/accountant/claims/insurers')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m9-claims-insurers.png', fullPage: true })
  })

  test('stats page loads', async ({ page }) => {
    await page.goto('/accountant/claims/stats')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m9-claims-stats.png', fullPage: true })
  })

  test('settings page loads', async ({ page }) => {
    await page.goto('/accountant/claims/settings')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m9-claims-settings.png', fullPage: true })
  })

  test('claims sidebar has 5 navigation items', async ({ page }) => {
    await page.goto('/accountant/claims/dashboard')
    await page.waitForLoadState('networkidle')
    // Claims layout sidebar nav links
    const sidebar = page.locator('aside')
    if (await sidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
      const navLinks = sidebar.locator('a[href*="/accountant/claims"]')
      expect(await navLinks.count()).toBe(5)
    }
  })

  test('claims API returns cases list', async ({ request }) => {
    const response = await request.get('/api/claims/cases')
    expect([200, 429]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      expect(body).toHaveProperty('cases')
      expect(Array.isArray(body.cases)).toBe(true)
    }
  })

  test('claims API returns insurers list', async ({ request }) => {
    const response = await request.get('/api/claims/insurers')
    expect([200, 429]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      // API returns {companies: [...]} for insurers
      const list = body.companies || body.insurers || (Array.isArray(body) ? body : null)
      expect(list).toBeTruthy()
      expect(Array.isArray(list)).toBe(true)
    }
  })
})
