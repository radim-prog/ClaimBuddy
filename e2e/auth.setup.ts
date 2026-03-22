import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('input[name="username"]', 'radim')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/accountant/**')
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
