import { test, expect } from '@playwright/test'

test.describe('Pricing Page (Public)', () => {
  test('loads without authentication (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/pricing')
    expect(response?.status()).toBe(200)
  })

  test('displays 4 tier cards', async ({ page }) => {
    await page.goto('/pricing')
    // Check all 4 plan names exist in pricing section
    const pricingSection = page.locator('#pricing')
    await expect(pricingSection).toBeVisible({ timeout: 10000 })
    await expect(pricingSection.getByText('Free', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Starter', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Professional', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('Enterprise', { exact: true })).toBeVisible()
  })

  test('shows correct monthly prices', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForSelector('#pricing', { timeout: 10000 })
    await expect(page.getByText('Zdarma').first()).toBeVisible()
    // 490, 1 290, 2 990 (Czech locale formatting)
    await expect(page.getByText('490').first()).toBeVisible()
    await expect(page.getByText(/1[\s\u00a0]?290/).first()).toBeVisible()
    await expect(page.getByText(/2[\s\u00a0]?990/).first()).toBeVisible()
  })

  test('billing toggle buttons exist', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForSelector('#pricing', { timeout: 10000 })
    // Both toggle buttons should be present
    await expect(page.getByRole('button', { name: /Měsíčně/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ročně/i })).toBeVisible()
  })

  test('CTA buttons link to /auth/register', async ({ page }) => {
    await page.goto('/pricing')
    const registerLinks = page.locator('a[href="/auth/register"]')
    expect(await registerLinks.count()).toBeGreaterThanOrEqual(1)
  })

  test('FAQ section is visible', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('Časté otázky')).toBeVisible()
    await expect(page.getByText('Co je zahrnuto ve 30denním trialu?')).toBeVisible()
  })

  test('testimonials section shows quotes', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('Co říkají účetní')).toBeVisible()
    await expect(page.getByText('Ing. Petra Nováková')).toBeVisible()
  })

  test('hero section visible with CTA', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('Účetní operační systém')).toBeVisible()
    await expect(page.getByText('Začít zdarma').first()).toBeVisible()
  })

  test('-17% discount badge visible', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('-17%')).toBeVisible()
  })
})
