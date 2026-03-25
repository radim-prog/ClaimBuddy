import { test, expect } from '@playwright/test'

test.describe('Pricing Page (Public)', () => {
  test('loads without authentication (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/pricing')
    expect(response?.status()).toBe(200)
  })

  test('displays 3 tier cards (client portal default)', async ({ page }) => {
    await page.goto('/pricing')
    const pricingSection = page.locator('#pricing')
    await expect(pricingSection).toBeVisible({ timeout: 10000 })
    // Default view is client portal: Free, Plus, Premium
    await expect(pricingSection.getByText('Free', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Plus', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Premium', { exact: true })).toBeVisible()
  })

  test('shows correct monthly prices', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForSelector('#pricing', { timeout: 10000 })
    // Client plans: Free (0), Plus (199), Premium (799)
    await expect(page.getByText('Zdarma').first()).toBeVisible()
    await expect(page.getByText('199').first()).toBeVisible()
    await expect(page.getByText('799').first()).toBeVisible()
  })

  test('billing toggle exists', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForSelector('#pricing', { timeout: 10000 })
    // Toggle switch with Měsíčně / Ročně labels
    await expect(page.getByText('Měsíčně')).toBeVisible()
    await expect(page.getByText('Ročně')).toBeVisible()
  })

  test('CTA buttons link to /auth/register', async ({ page }) => {
    await page.goto('/pricing')
    const registerLinks = page.locator('a[href="/auth/register"]')
    expect(await registerLinks.count()).toBeGreaterThanOrEqual(1)
  })

  test('FAQ section is visible', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('Časté dotazy')).toBeVisible()
    // Check at least one FAQ question exists
    await expect(page.getByText('Jak funguje AI vytěžování dokladů?')).toBeVisible()
  })

  test('pricing header visible with description', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('Jednoduchý a transparentní ceník')).toBeVisible()
    await expect(page.getByText('Začněte zdarma').first()).toBeVisible()
  })

  test('yearly discount badge visible', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('Ušetříte až 17')).toBeVisible()
  })
})
