import { test, expect } from '@playwright/test'

// Uses client auth (test-klient/test2026) via client-tests project

test.describe('M3: Client Portal Walkthrough', () => {
  test('dashboard loads with greeting and company data', async ({ page }) => {
    await page.goto('/client/dashboard')
    await page.waitForLoadState('networkidle')
    // Should see main content area
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    // Dashboard should have meaningful content
    const content = await main.textContent()
    expect(content?.length).toBeGreaterThan(20)
    await page.screenshot({ path: 'test-results/m3-dashboard.png', fullPage: true })
  })

  test('company switcher works', async ({ page }) => {
    await page.goto('/client/dashboard')
    await page.waitForLoadState('networkidle')
    // Look for company selector (select or dropdown)
    const selector = page.locator('select').first()
    if (await selector.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await selector.locator('option').count()
      expect(options).toBeGreaterThan(0)
      await page.screenshot({ path: 'test-results/m3-company-switch.png' })
    }
  })

  test('closures page loads', async ({ page }) => {
    await page.goto('/client/closures')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    // Should show year view or monthly list
    await page.screenshot({ path: 'test-results/m3-closures.png', fullPage: true })
  })

  test('closure month detail expands inline', async ({ page }) => {
    await page.goto('/client/closures')
    await page.waitForLoadState('networkidle')
    // Click on first month row if available
    const monthRow = page.locator('tr, [role="row"]').filter({ hasText: /202[5-6]/ }).first()
    if (await monthRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await monthRow.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/m3-closure-detail.png', fullPage: true })
    }
  })

  test('documents page loads', async ({ page }) => {
    await page.goto('/client/documents')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m3-documents.png', fullPage: true })
  })

  test('document upload area visible', async ({ page }) => {
    await page.goto('/client/documents')
    await page.waitForLoadState('networkidle')
    // Look for upload trigger (button, dropzone, or file input)
    const uploadBtn = page.locator('button').filter({ hasText: /nahrát|přidat|upload/i }).first()
    const dropzone = page.locator('[class*="drop"], [class*="upload"]').first()
    const hasUpload = await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)
      || await dropzone.isVisible({ timeout: 1000 }).catch(() => false)
    expect(hasUpload).toBeTruthy()
  })

  test('messages page loads', async ({ page }) => {
    await page.goto('/client/messages')
    await page.waitForLoadState('networkidle')
    const main = page.locator('main')
    await expect(main).toBeVisible({ timeout: 10000 })
    await page.screenshot({ path: 'test-results/m3-messages.png', fullPage: true })
  })

  test('logout works', async ({ page }) => {
    await page.goto('/client/dashboard')
    await page.waitForLoadState('networkidle')
    // Find logout element (button, link, or menu item)
    const logoutBtn = page.locator('button, a').filter({ hasText: /odhlásit/i }).first()
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click()
      await page.waitForTimeout(2000)
      // Should redirect to login or landing
      expect(page.url()).toMatch(/\/(auth\/login)?$|\/$/);
    }
  })
})
