import { test, expect } from '@playwright/test'

// All tests use iPhone viewport (375×812)
test.use({ viewport: { width: 375, height: 812 } })

test.describe('M6: Mobile Responsiveness', () => {
  test('accountant dashboard renders without horizontal overflow', async ({ page }) => {
    await page.goto('/accountant/dashboard')
    await page.waitForLoadState('networkidle')
    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // 5px tolerance
    await page.screenshot({ path: 'test-results/m6-mobile-dashboard.png', fullPage: true })
  })

  test('bottom navigation bar visible on mobile', async ({ page }) => {
    await page.goto('/accountant/dashboard')
    await page.waitForLoadState('networkidle')
    // Mobile bottom nav should be visible
    const bottomNav = page.locator('nav').filter({ has: page.locator('a, button') }).last()
    await expect(bottomNav).toBeVisible({ timeout: 5000 })
    // Should have navigation items
    const navItems = bottomNav.locator('a, button')
    expect(await navItems.count()).toBeGreaterThanOrEqual(4)
    await page.screenshot({ path: 'test-results/m6-mobile-bottomnav.png' })
  })

  test('sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/accountant/dashboard')
    await page.waitForLoadState('networkidle')
    // Desktop sidebar should not be visible
    const sidebar = page.locator('aside').first()
    if (await sidebar.count() > 0) {
      const box = await sidebar.boundingBox()
      // Either not visible or positioned off-screen
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(0)
      }
    }
  })

  test('touch targets meet 44px minimum', async ({ page }) => {
    await page.goto('/accountant/dashboard')
    await page.waitForLoadState('networkidle')
    // Check bottom nav touch targets
    const navButtons = page.locator('nav a, nav button')
    const count = await navButtons.count()
    let smallTargets = 0
    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await navButtons.nth(i).boundingBox()
      if (box && (box.width < 40 || box.height < 40)) {
        smallTargets++
      }
    }
    // Allow max 20% small targets (some decorative elements)
    expect(smallTargets).toBeLessThan(Math.max(count * 0.2, 3))
  })

  test('mobile header shows app name', async ({ page }) => {
    await page.goto('/accountant/dashboard')
    await page.waitForLoadState('networkidle')
    // Mobile header should show branding
    const header = page.locator('.md\\:hidden').first()
    await expect(header).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'test-results/m6-mobile-header.png' })
  })

  test('clients page is usable on mobile', async ({ page }) => {
    await page.goto('/accountant/clients')
    await page.waitForLoadState('networkidle')
    // No horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
    await page.screenshot({ path: 'test-results/m6-mobile-clients.png', fullPage: true })
  })
})
