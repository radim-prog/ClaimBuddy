import { test, expect } from '@playwright/test'

// Auth is handled by auth.setup.ts + storageState in playwright.config.ts

test.describe('Subscription Management', () => {
  test('subscription page loads (auth required)', async ({ page }) => {
    await page.goto('/accountant/admin/subscription')
    await expect(page.getByText('Předplatné')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Správa vašeho tarifu')).toBeVisible()
  })

  test('shows current plan banner', async ({ page }) => {
    await page.goto('/accountant/admin/subscription')
    await expect(page.getByText('Aktuální tarif').first()).toBeVisible({ timeout: 10000 })
  })

  test('displays 3 pricing cards', async ({ page }) => {
    await page.goto('/accountant/admin/subscription')
    await page.waitForSelector('#pricing-cards', { timeout: 10000 })
    const cards = page.locator('#pricing-cards > div')
    expect(await cards.count()).toBe(3)
  })

  test('billing toggle buttons present', async ({ page }) => {
    await page.goto('/accountant/admin/subscription')
    await page.waitForSelector('#pricing-cards', { timeout: 10000 })
    await expect(page.getByRole('button', { name: /Měsíčně/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ročně/i })).toBeVisible()
  })

  test('add-ons section shows credit packs', async ({ page }) => {
    await page.goto('/accountant/admin/subscription')
    await expect(page.getByText('Doplňkové služby')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Extra vytěžování (50 kreditů)')).toBeVisible()
    await expect(page.getByText('Extra vytěžování (200 kreditů)')).toBeVisible()
  })

  test('contact section is visible', async ({ page }) => {
    await page.goto('/accountant/admin/subscription')
    await expect(page.getByText('Potřebujete pomoc s výběrem?')).toBeVisible({ timeout: 10000 })
  })
})
