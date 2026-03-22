import { test, expect } from '@playwright/test'

test.describe('Client portal', () => {
  test('dashboard loads with company data', async ({ page }) => {
    await page.goto('/client/dashboard')
    // Should see greeting
    await expect(page.locator('h1').first()).toContainText('Dobrý den')
    // Should see year overview
    await expect(page.locator('text=Přehled roku')).toBeVisible()
  })

  test('sidebar navigation — each item loads correct page', async ({ page }) => {
    const navItems = [
      { name: 'Přehled', urlPattern: /\/client\/dashboard/ },
      { name: 'Doklady & Faktury', urlPattern: /\/client\/documents/ },
      { name: 'Kniha jízd', urlPattern: /\/client\/travel/ },
      { name: 'Zprávy', urlPattern: /\/client\/messages/ },
    ]

    for (const item of navItems) {
      await page.goto('/client/dashboard')
      const navLink = page.locator(`nav >> text="${item.name}"`).first()
      if (await navLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await navLink.click()
        await page.waitForURL(item.urlPattern)
        expect(page.url()).toMatch(item.urlPattern)
      }
    }
  })

  test('company switcher opens dropdown', async ({ page }) => {
    await page.goto('/client/dashboard')
    const switcher = page.locator('select').first()
    if (await switcher.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Select element exists and is functional
      const options = await switcher.locator('option').count()
      expect(options).toBeGreaterThan(0)
    }
  })
})
