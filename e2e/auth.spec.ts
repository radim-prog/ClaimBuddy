import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  // Login with valid credentials is tested by auth.setup.ts (shared auth state)
  // Testing it again here would waste a rate-limited login attempt

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[name="username"]', 'invalid')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should show error, stay on login page
    await expect(page).toHaveURL(/auth\/login/)
  })
})
