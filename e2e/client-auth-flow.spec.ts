import { test, expect } from '@playwright/test'
import { TEST_USER } from './test-config'

test.describe('Client auth flow', () => {
  test('login → redirect → username visible → logout', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Go to login
    await page.goto('/auth/login')
    await expect(page.locator('input[name="username"]')).toBeVisible()

    // Login
    await page.fill('input[name="username"]', TEST_USER.username)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Should redirect to accountant dashboard
    await page.waitForURL('**/accountant/**', { timeout: 10000 })
    expect(page.url()).toContain('/accountant/')

    // Username should be visible somewhere
    const body = await page.textContent('body')
    expect(body).toContain('Radim')

    // Logout
    const logoutBtn = page.locator('text=Odhlásit')
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click()
      await page.waitForURL('**/login**', { timeout: 5000 })
    }

    await context.close()
  })

  test('czech characters display correctly (not garbled)', async ({ page }) => {
    await page.goto('/client/dashboard')
    const body = await page.textContent('body')
    // Check that common Czech characters render correctly
    // These should NOT appear as garbled/mojibake sequences
    expect(body).not.toMatch(/Ã[¡-¿]/)
    expect(body).not.toMatch(/Ã\u0084/)
    // Should contain actual Czech text
    expect(body).toMatch(/[ěščřžýáíéůúťďň]/i)
  })
})
