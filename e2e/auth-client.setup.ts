import { test as setup } from '@playwright/test'

setup('authenticate-client', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('input[name="username"]', 'test-klient')
  await page.fill('input[name="password"]', 'test2026')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/client/**', { timeout: 15000 })
  await page.context().storageState({ path: 'e2e/.auth/client.json' })
})
