import { test, expect } from '@playwright/test'

// Login helper
async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.fill('input[name="username"]', 'radim')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/accountant/dashboard', { timeout: 10000 })
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('dashboard loads with matrix', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('sidebar navigation works', async ({ page }) => {
    // Click Klienti
    await page.click('a[href="/accountant/clients"]')
    await page.waitForURL('**/accountant/clients')
    await expect(page).toHaveURL(/accountant\/clients/)

    // Click Úkoly
    await page.click('a[href="/accountant/tasks"]')
    await page.waitForURL('**/accountant/tasks')
    await expect(page).toHaveURL(/accountant\/tasks/)
  })

  test('admin section visible for admin user', async ({ page }) => {
    await expect(page.locator('a[href="/accountant/admin"]')).toBeVisible()
    await page.click('a[href="/accountant/admin"]')
    await page.waitForURL('**/accountant/admin')
    await expect(page).toHaveURL(/accountant\/admin/)
  })
})
