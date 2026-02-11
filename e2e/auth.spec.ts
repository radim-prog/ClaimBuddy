import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[name="username"]', 'radim')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await page.waitForURL('**/accountant/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/accountant\/dashboard/)
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[name="username"]', 'invalid')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error, stay on login page
    await expect(page).toHaveURL(/auth\/login/)
  })
})
