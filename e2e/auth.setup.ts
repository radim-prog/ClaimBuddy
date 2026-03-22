import { test as setup } from '@playwright/test'
import { TEST_USER } from './test-config'

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('input[name="username"]', TEST_USER.username)
  await page.fill('input[name="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/accountant/**')
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
