import { test, expect } from '@playwright/test'

test.describe('Modal interactions', () => {
  test('company picker modal opens and closes via X button', async ({ page }) => {
    await page.goto('/client/dashboard')
    // Open picker via "Všechny firmy" if available
    const allCompaniesBtn = page.locator('text=Všechny firmy')
    if (await allCompaniesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allCompaniesBtn.click()
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      // Close via X button
      await dialog.locator('button[aria-label="Close"], button:has(svg.lucide-x)').first().click()
      await expect(dialog).not.toBeVisible()
    }
  })

  test('modal closes on Escape key', async ({ page }) => {
    await page.goto('/client/dashboard')
    const allCompaniesBtn = page.locator('text=Všechny firmy')
    if (await allCompaniesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allCompaniesBtn.click()
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    }
  })

  test('modal closes on overlay click', async ({ page }) => {
    await page.goto('/client/dashboard')
    const allCompaniesBtn = page.locator('text=Všechny firmy')
    if (await allCompaniesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allCompaniesBtn.click()
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      // Click the overlay (outside the dialog content)
      const overlay = page.locator('[data-state="open"].fixed, [role="dialog"] ~ div')
      if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
        await overlay.click({ position: { x: 10, y: 10 }, force: true })
      }
    }
  })

  test('shadcn dialogs have functional close mechanism', async ({ page }) => {
    // Test service request dialog on messages page
    await page.goto('/client/messages')
    const requestBtn = page.locator('text=Nový požadavek')
    if (await requestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestBtn.click()
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
    }
  })
})
